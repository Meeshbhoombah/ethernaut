import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


export default buildModule("Ethernaut", (m) => {

  console.log(m.getAccount(0));

  const fallback = m.contract("Fallback");
  const fallout = m.contract("Fallout");
  const coinFlip = m.contract("CoinFlip");
  const telephone = m.contract("Telephone");
  const token = m.contract("Token", [20n]);
  // const delegate = m.contract("Delegate");
  // const delegate = m.deploy(delegateContract, [deployer.address]);
  // const delegation = m.contract("Delegation");
  // const delegation = m.deploy(delegationContract, [delegate.address]);
  const force = m.contract("Force");
  // const password = ethers.utils.formatBytes32String("password");
  // const vault = m.contract("Vault", [password]);
  
  return { 
    fallback,
    fallout,
    coinFlip,
    telephone,
    // delegate
    // delegation
    force,
    vault
  };

});
