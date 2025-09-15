import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CounterModule", (m) => {
  const counter = m.contract("Counter");
  const fallback = m.contract("Fallback");

  m.call(counter, "incBy", [5n]);

  return { counter };
});
