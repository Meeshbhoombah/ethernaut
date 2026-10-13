import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { readFile } from "node:fs/promises";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const denialArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/Denial.sol/Denial.json",
    "utf8"
  )
);

const attackerArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/DenialAttacker.sol/DenialAttacker.json",
    "utf8"
  )
);

let owner;
let denial;
let attacker;

beforeEach(async () => {
  owner = await provider.getSigner(0);
  const attackerSigner = await provider.getSigner(1);

  const denialFactory = new ethers.ContractFactory(
    denialArtifact.abi,
    denialArtifact.bytecode,
    owner
  );

  denial = await denialFactory.deploy();
  await denial.waitForDeployment();

  const attackerFactory = new ethers.ContractFactory(
    attackerArtifact.abi,
    attackerArtifact.bytecode,
    attackerSigner
  );

  attacker = await attackerFactory.deploy();
  await attacker.waitForDeployment();

  await (
    await owner.sendTransaction({
      to: await denial.getAddress(),
      value: ethers.parseEther("1"),
    })
  ).wait();

  await (
    await denial.setWithdrawPartner(await attacker.getAddress())
  ).wait();
});

test("prevents the owner from withdrawing by exhausting forwarded gas", async () => {
  const balanceBefore = await provider.getBalance(
    await denial.getAddress()
  );

  await assert.rejects(async () => {
    const tx = await denial.withdraw({ gasLimit: 100_000 });
    await tx.wait();
  });

  assert.equal(
    await provider.getBalance(await denial.getAddress()),
    balanceBefore
  );
});
