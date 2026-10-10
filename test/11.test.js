
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const providerUrl = "http://127.0.0.1:8545";

const elevatorArtifact = JSON.parse(
  await readFile(
    new URL("../artifacts/contracts/Elevator.sol/Elevator.json", import.meta.url),
    "utf8"
  )
);

const attackerArtifact = JSON.parse(
  await readFile(
    new URL("../artifacts/contracts/ElevatorAttacker.sol/ElevatorAttacker.json", import.meta.url),
    "utf8"
  )
);

describe("Ethernaut Challenge 11: Elevator", () => {
  let provider;
  let deployer;
  let attacker;
  let elevator;
  let elevatorAttacker;

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(providerUrl);
    deployer = await provider.getSigner(0);
    attacker = await provider.getSigner(1);

    const elevatorFactory = new ethers.ContractFactory(
      elevatorArtifact.abi,
      elevatorArtifact.bytecode,
      deployer
    );

    elevator = await elevatorFactory.deploy();
    await elevator.waitForDeployment();

    const attackerFactory = new ethers.ContractFactory(
      attackerArtifact.abi,
      attackerArtifact.bytecode,
      attacker
    );

    elevatorAttacker = await attackerFactory.deploy(
      await elevator.getAddress()
    );
    await elevatorAttacker.waitForDeployment();
  });

  it("starts below the top floor", async () => {
    assert.equal(await elevator.top(), false);
    assert.equal(await elevator.floor(), 0n);
  });

  it("allows the attacker to make the elevator believe it is at the top", async () => {
    const targetFloor = 10n;

    await (
      await elevatorAttacker.connect(attacker).attack(targetFloor)
    ).wait();

    assert.equal(await elevator.floor(), targetFloor);
    assert.equal(await elevator.top(), true);
  });
});

