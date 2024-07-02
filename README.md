# DeFi Strategy Manager for Aave and Compound using EIP-2535 and ERC4626.

This task involves implementing a StrategyManager contract using the EIP-2535 Diamond Standard (Diamond Standard Proxy Pattern). The goal is to create a modular and upgradeable smart contract system where the StrategyManager interacts with strategy contracts that interface with DeFi protocols like Aave and Compound on the Ethereum mainnet. Each strategy will utilize the ERC4626 standard for tokenized vaults. The implementation includes depositing, withdrawing, and checking balances through the StrategyManager, deploying these contracts on a locally forked mainnet, and writing tests to ensure functionality. Additionally, the addFunction logic in the Diamond-3 contract has been enhanced to automatically replace existing selectors if they already exist, eliminating the need for a separate replace call.

## Diamond Contract Structure and Deployment Overview

The `contracts/Diamond.sol` Implements a diamond.

The `contracts/facets/DiamondCutFacet.sol` Implements the `diamondCut` external function.

The `contracts/facets/DiamondLoupeFacet.sol` Implements the four standard loupe functions.

The `contracts/libraries/LibDiamond.sol` Implements Diamond Storage and a `diamondCut` internal function.

The `contracts/facets/StrategyManager.sol` Implements the StrategyManager contract with functions for managing and interacting with different DeFi strategies.

The `contracts/strategies/AaveStrategy.sol` Implements the Aave ETH Deposit Vault strategy, interacting with the Aave protocol to deposit ETH, manage shares, and handle ERC4626 vault operations.

The `contracts/strategies/CompoundStrategy.sol` Implements the Compound ETH Deposit Vault strategy, interacting with the Compound protocol to deposit ETH, manage shares, and handle ERC4626 vault operations.

The `test/diamondTest.js` Tests for the `diamondCut` functions, Diamond Loupe functions and the Strategy Manager unctions.

The `scripts/deploy.js` Deploys the diamond contract, Strategy Manager, ETH Aave and Compound strategies.

## Installation

1. Clone this repo:

```console
git clone git@github.com:ummehanizaki/Diamond-Strategy-Manager.git
```

2. Install NPM packages:

```console
cd diamond-3-hardhat
npm install
```

## Run tests:

```console
npx hardhat test
```

## Deployment

```console
npx hardhat run scripts/deploy.js
```

### How the scripts/deploy.js script works

1. DiamondCutFacet is deployed.
1. The diamond is deployed, passing as arguments to the diamond constructor the owner address of the diamond and the DiamondCutFacet address. DiamondCutFacet has the `diamondCut` external function which is used to upgrade the diamond to add more functions.
1. The `DiamondInit` contract is deployed. This contains an `init` function which is called on the first diamond upgrade to initialize state of some state variables.
1. The diamond is upgraded. The `diamondCut` function is used to add functions from facets to the diamond. In addition the `diamondCut` function calls the `init` function from the `DiamondInit` contract using `delegatecall` to initialize state variables.
1. The `StrategyManager` contract is deployed. This contract manages the interactions with different DeFi strategies, including depositing, withdrawing, and querying balances.
1. The `AaveETHDeposit` Vault strategy contract is deployed. This contract interacts with the Aave protocol to manage deposits and withdrawals, as well as handle user shares based on the ERC4626 standard. It is added to the Strategy Manager contract.
1. The `CompoundETHDepositVault` strategy contract is deployed. This contract interacts with the Compound protocol for similar functionalities as the Aave strategy but for the Compound protocol. It is also added to the Strategy Manager contract.
1. (Optional) Basic tests of deposit, withdraw are performed to verify the functionality of the StrategyManager contract with the deployed Aave and Compound strategies.
