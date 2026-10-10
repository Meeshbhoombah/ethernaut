import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const providerUrl = "http://127.0.0.1:8545";

const reentranceArtifact = JSON.parse(
  await readFile(
    new URL("../artifacts/contracts/Reentrance.sol/Reentrance.json", import.meta.url),
    "utf8"
  )
);

const attackerArtifact = JSON.parse(
  await readFile(
    new URL("../artifacts/contracts/ReentranceAttacker.sol/ReentranceAttacker.json", import.meta.url),
    "utf8"
  )
);

describe("Ethernaut Challenge 10: Re-entrancy", () => {
  let provider;
  let deployer;
  let attacker;
  let reentrance;
  let reentranceAttacker;

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(providerUrl);
    deployer = await provider.getSigner(0);
    attacker = await provider.getSigner(1);

    const factory = new ethers.ContractFactory(
      reentranceArtifact.abi,
      reentranceArtifact.bytecode,
      deployer
    );

    reentrance = await factory.deploy();
    await reentrance.waitForDeployment();

    await (
      await reentrance.connect(deployer).donate(
        await deployer.getAddress(),
        { value: ethers.parseEther("5") }
      )
    ).wait();

    const attackerFactory = new ethers.ContractFactory(
      attackerArtifact.abi,
      attackerArtifact.bytecode,
      attacker
    );

    reentranceAttacker = await attackerFactory.deploy(
      await reentrance.getAddress()
    );
    await reentranceAttacker.waitForDeployment();
  });

  it("allows users to withdraw their own donations", async () => {
    const amount = ethers.parseEther("1");

    await (
      await reentrance.connect(attacker).donate(
        await attacker.getAddress(),
        { value: amount }
      )
    ).wait();

    await (
      await reentrance.connect(attacker).withdraw(amount)
    ).wait();

    assert.equal(
      await reentrance.balances(await attacker.getAddress()),
      0n
    );
  });

  it("allows the attacker to drain the vulnerable contract through re-entrancy", async () => {
    const contractAddress = await reentrance.getAddress();
    const balanceBefore = await provider.getBalance(contractAddress);

    assert.equal(balanceBefore, ethers.parseEther("5"));

    const tx = await reentranceAttacker.attack({
      value: ethers.parseEther("1"),
    });
    const receipt = await tx.wait();

    assert.equal(
      await provider.getBalance(contractAddress, receipt.blockNumber),
      0n
    );
  });
});
