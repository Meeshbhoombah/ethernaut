import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


export default buildModule("Ethernaut", (m) => {

  const fallback = m.contract("Fallback");
  const fallout = m.contract("Fallout");
  const coinFlip = m.contract("CoinFlip");
  const telephone = m.contract("Telephone");
  const token = m.contract("Token", [20n]);
  
  return { 
      fallback,
      fallout,
      coinFlip,
      telephone,
      token
  };

});
