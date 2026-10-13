import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { readFile } from "node:fs/promises";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const shopArtifact = JSON.parse(
  await readFile("artifacts/contracts/Shop.sol/Shop.json", "utf8")
);

const attackerArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/ShopAttacker.sol/ShopAttacker.json",
    "utf8"
  )
);

let signer;
let shop;
let attacker;

beforeEach(async () => {
  signer = await provider.getSigner(1);

  const shopFactory = new ethers.ContractFactory(
    shopArtifact.abi,
    shopArtifact.bytecode,
    signer
  );

  shop = await shopFactory.deploy();
  await shop.waitForDeployment();

  const attackerFactory = new ethers.ContractFactory(
    attackerArtifact.abi,
    attackerArtifact.bytecode,
    signer
  );

  attacker = await attackerFactory.deploy(await shop.getAddress());
  await attacker.waitForDeployment();
});

test("buys the item for zero by returning a dynamic price", async () => {
  assert.equal(await shop.price(), 100n);
  assert.equal(await shop.isSold(), false);

  await (await attacker.attack()).wait();

  assert.equal(await shop.isSold(), true);
  assert.equal(await shop.price(), 0n);
});
