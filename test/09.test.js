import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const providerUrl = "http://127.0.0.1:8545";

const artifact = JSON.parse(
  await readFile(
    new URL("../artifacts/contracts/King.sol/King.json", import.meta.url),
    "utf8"
  )
);

describe("Ethernaut Challenge 09: King", () => {
  let provider;
  let deployer;
  let attacker;
  let king;

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(providerUrl);
    deployer = await provider.getSigner(0);
    attacker = await provider.getSigner(1);

    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      deployer
    );

    king = await factory.deploy({
      value: ethers.parseEther("1"),
    });

    await king.waitForDeployment();
  });

  it("sets the deployer as the initial king", async () => {
    assert.equal(
      (await king._king()).toLowerCase(),
      (await deployer.getAddress()).toLowerCase()
    );
  });

  it("allows a new player to become king by paying more than the current prize", async () => {
    const attackerAddress = await attacker.getAddress();
    const contractAddress = await king.getAddress();

    const tx = await attacker.sendTransaction({
      to: contractAddress,
      value: ethers.parseEther("1.1"),
    });

    const receipt = await tx.wait();

    assert.equal(receipt.status, 1);
    assert.equal(
      (await king._king()).toLowerCase(),
      attackerAddress.toLowerCase()
    );
    assert.equal(await king.prize(), ethers.parseEther("1.1"));
  });

  it("rejects payments that do not exceed the current prize", async () => {
    await assert.rejects(
      attacker.sendTransaction({
        to: await king.getAddress(),
        value: ethers.parseEther("0.5"),
      })
    );
  });

});
