import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const providerUrl = "http://127.0.0.1:8545";

const gatekeeperArtifact = JSON.parse(
  await readFile(
    new URL(
      "../artifacts/contracts/GatekeeperTwo.sol/GatekeeperTwo.json",
      import.meta.url
    ),
    "utf8"
  )
);

const attackerArtifact = JSON.parse(
  await readFile(
    new URL(
      "../artifacts/contracts/GatekeeperTwoAttacker.sol/GatekeeperTwoAttacker.json",
      import.meta.url
    ),
    "utf8"
  )
);

describe("Ethernaut Challenge 14: Gatekeeper Two", () => {
  let provider;
  let deployer;
  let attacker;
  let gatekeeper;

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(providerUrl);
    deployer = await provider.getSigner(0);
    attacker = await provider.getSigner(1);

    const factory = new ethers.ContractFactory(
      gatekeeperArtifact.abi,
      gatekeeperArtifact.bytecode,
      deployer
    );

    gatekeeper = await factory.deploy();
    await gatekeeper.waitForDeployment();
  });

  it("starts without an entrant", async () => {
    assert.equal(await gatekeeper.entrant(), ethers.ZeroAddress);
  });

  it("passes all three gates during the attacker's constructor", async () => {
    const factory = new ethers.ContractFactory(
      attackerArtifact.abi,
      attackerArtifact.bytecode,
      attacker
    );

    const attackerContract = await factory.deploy(
      await gatekeeper.getAddress()
    );

    await attackerContract.waitForDeployment();

    assert.equal(
      await gatekeeper.entrant(),
      await attacker.getAddress()
    );
  });

});

