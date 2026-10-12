
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { readFile } from "node:fs/promises";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const magicNumArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/MagicNum.sol/MagicNum.json",
    "utf8"
  )
);

// Init code deploys this 10-byte runtime:
// 602a60005260206000f3
//
// Runtime:
// PUSH1 0x2a  -> push 42
// PUSH1 0x00  -> memory offset 0
// MSTORE      -> store 42
// PUSH1 0x20  -> return 32 bytes
// PUSH1 0x00  -> return from offset 0
// RETURN      -> return 32-byte word
const solverInitCode =
  "0x69602a60005260206000f3600052600a6016f3";

let signer;
let magicNum;

beforeEach(async () => {
  signer = await provider.getSigner(1);

  const factory = new ethers.ContractFactory(
    magicNumArtifact.abi,
    magicNumArtifact.bytecode,
    signer
  );

  magicNum = await factory.deploy();
  await magicNum.waitForDeployment();
});

test("deploys a solver that returns 42 with at most 10 bytes of runtime code", async () => {
  const deployTx = await signer.sendTransaction({
    data: solverInitCode,
  });

  const receipt = await deployTx.wait();
  assert.ok(receipt.contractAddress);

  const solverAddress = receipt.contractAddress;

  await (
    await magicNum.setSolver(solverAddress)
  ).wait();

  assert.equal(
    (await magicNum.solver()).toLowerCase(),
    solverAddress.toLowerCase()
  );

  const runtimeCode = await provider.getCode(solverAddress);

  assert.equal(ethers.dataLength(runtimeCode), 10);

  const solver = new ethers.Contract(
    solverAddress,
    [
      "function whatIsTheMeaningOfLife() external view returns (uint256)",
    ],
    provider
  );

  assert.equal(
    await solver.whatIsTheMeaningOfLife(),
    42n
  );
});

