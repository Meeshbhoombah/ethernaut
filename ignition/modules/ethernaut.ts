import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


export default buildModule("Ethernaut", (m) => {

  const fallback = m.contract("Fallback");
  const fallout = m.contract("Fallout");
  
  return { 
      fallback,
      fallout
  };

});
