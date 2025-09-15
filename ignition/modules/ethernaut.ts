import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


export default buildModule("CounterModule", (m) => {

  const fallback = m.contract("Fallback");
  return { counter };

});
