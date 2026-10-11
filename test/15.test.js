
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const providerUrl = "http://127.0.0.1:8545";

const naughtCoinArtifact = JSON.parse(
  await readFile(
    new URL(
      "../artifacts/contracts/NaughtCoin.sol/NaughtCoin.json",
      import.meta.url
    ),
    "utf8"
  )
);

describe("Ethernaut Challenge 15: Naught Coin", () => {
  let provider;
  let deployer;
  let player;
  let naughtCoin;

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(providerUrl);
    deployer = await provider.getSigner(0);
    player = await provider.getSigner(1);

    const factory = new ethers.ContractFactory(
      naughtCoinArtifact.abi,
      naughtCoinArtifact.bytecode,
      deployer
    );

    naughtCoin = await factory.deploy(await player.getAddress());
    await naughtCoin.waitForDeployment();
  });

  it("gives the player one million tokens", async () => {
    const balance = await naughtCoin.balanceOf(
      await player.getAddress()
    );

    assert.equal(balance, ethers.parseUnits("1000000", 18));
  });

  it("prevents the player from transferring tokens directly during the lock", async () => {
    await assert.rejects(
      naughtCoin.connect(player).transfer(
        await deployer.getAddress(),
        ethers.parseUnits("1", 18)
      )
    );
  });

  it("allows the player to bypass the lock using approve and transferFrom", async () => {
    const playerAddress = await player.getAddress();
    const recipientAddress = await deployer.getAddress();
    const balance = await naughtCoin.balanceOf(playerAddress);

    await (
      await naughtCoin.connect(player).approve(
        recipientAddress,
        balance
      )
    ).wait();

    await (
      await naughtCoin.connect(deployer).transferFrom(
        playerAddress,
        recipientAddress,
        balance
      )
    ).wait();

    assert.equal(
      await naughtCoin.balanceOf(playerAddress),
      0n
    );

    assert.equal(
      await naughtCoin.balanceOf(recipientAddress),
      balance
    );
  });
});

