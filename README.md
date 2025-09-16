# Ethernaut
Solutions to OpenZepplin's "Ethernaut" Capture-the-Flag

## Getting Started
### Prerequisites
#### Node
#### Yarn

### Installation
1. Clone
2. cd
3. Install packages
4. Start a local blockchain network
```
yarn hardhat node
```

5. Make the `solve` script executable
6. Link the `solve` script
7. Build the contracts
```
yarn hardhat build
```

8. Deploy the contracts
```
yarn hardhat ignition deploy ignition/modules/ethernaut.ts --network localhost
```

### Development
Add a contract to `/contracts`. 

Compile the contract with `hardhat`.
```
yarn hardhat build
```

Some contracts use legacy versions of Open Zepplin's Smart Contract Libraries. 
These must be compiled with their relevant compiler, each of which have 
profiles located in `hardhat.config.ts`. Here's an example of how to compile
`Fallout.sol`, which uses Solidity `0.6.0`:
```
yarn hardhat build --build-profile legacy06 contracts/Fallout.sol
```

Specify both the build profile and the contract name.

#### The Deployer of Contracts
`hardhat` uses Account #0 of the generated accounts (viewable by listing 
accounts or when running the node with `hardhat node`.


## Usage

