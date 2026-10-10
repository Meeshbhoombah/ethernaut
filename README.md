# Ethernaut
Solutions to OpenZepplin's "Ethernaut" Capture-the-Flag

## Getting Started
### Prerequisites
#### Node
#### NPM
### Installation
1. Clone
2. cd
3. Install packages
4. Start a local blockchain network
```
npm run node
```
5. Build the contracts
```
npm run build
```

6. Run the test suite (contains the exploits)
```
npm test
```

### Development
Add a contract to `/contracts`. 

Compile the contract with `hardhat`.
```
npm run build
```

Some contracts use legacy versions of Open Zepplin's Smart Contract Libraries. 
These must be compiled with their relevant compiler, each of which have 
profiles located in `hardhat.config.ts`. Here's an example of how to compile
`Fallout.sol`, which uses Solidity `0.6.0`:
```
npm run build -- --build-profile legacy06 contracts/Fallout.sol
```

Specify both the build profile and the contract name.

#### The Deployer of Contracts
`hardhat` uses Account #0 of the generated accounts (viewable by listing 
accounts or when running the node with `hardhat node`.

## Usage
## Vulnerabilities
### 01
#### Classification
Improper Access Control
- Contract lets arbitrary caller change a privleged variable, `owner`, without 
  requiring authorization from the current owner

#### Impact
Privilege Escalation
- An ordinary user can obtain authority of the contract owner/invoke functions
  restricted by `onlyOwner`, including `withdraw()`

#### Cause
Missing Authorization Invariant
- `recieve()` function checks whether called contributed/sent ETH, fails to
  enfource intended restriction on who may become owner

Not simply vulnerable because `external` or publicly callable
- Public entry points are normal in Solidity
- Vulnerability = public entry point can modify privileged state w/o approprate
  authorization rule


