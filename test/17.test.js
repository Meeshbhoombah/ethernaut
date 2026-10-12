import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { readFile } from "node:fs/promises";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const recoveryArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/Recovery.sol/Recovery.json",
    "utf8"
  )
);

const simpleTokenArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/Recovery.sol/SimpleToken.json",
    "utf8"
  )
);

let signer;
let recovery;
let token;
let tokenAddress;

beforeEach(async () => {
  signer = await provider.getSigner(1);

  const factory = new ethers.ContractFactory(
    recoveryArtifact.abi,
    recoveryArtifact.bytecode,
    signer
  );

  recovery = await factory.deploy();
  await recovery.waitForDeployment();

  // The first contract created by Recovery has nonce 1.
  tokenAddress = ethers.getCreateAddress({
    from: await recovery.getAddress(),
    nonce: 1,
  });

  await (
    await recovery.generateToken("LostToken", 100)
  ).wait();

  token = new ethers.Contract(
    tokenAddress,
    simpleTokenArtifact.abi,
    signer
  );
});

test("recovers ETH from the lost SimpleToken contract", async () => {
  const deposit = ethers.parseEther("0.001");
  const recipient = await signer.getAddress();

  await (
    await signer.sendTransaction({
      to: tokenAddress,
      value: deposit,
    })
  ).wait();

  assert.equal(
    await provider.getBalance(tokenAddress),
    deposit
  );

  // Measure after the deposit transaction, so its gas cost is excluded.
  const recipientBalanceBefore = await provider.getBalance(recipient);

  const tx = await token.destroy(recipient);
  const receipt = await tx.wait();

  assert.equal(
    await provider.getBalance(tokenAddress, receipt.blockNumber),
    0n
  );

  const recipientBalanceAfter = await provider.getBalance(
    recipient,
    receipt.blockNumber
  );

  const gasCost = receipt.gasUsed * receipt.gasPrice;

  assert.equal(
    recipientBalanceAfter,
    recipientBalanceBefore + deposit - gasCost
  );
});

