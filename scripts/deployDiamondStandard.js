const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
  deployVault,
  deployStrategy,
  deployDiamondContracts,
} = require("./utility");
const {
  strategyNameAave,
  strategyNameCompound,
  cWETH,
  CompoundPoolWETH,
  CompoundWETH,
  amount,
  AavePoolWETH,
  aWETH,
  AaveWETH,
} = require("./constants");
const {
  testStrategyRemovalAndAddition,
  testStrategy,
} = require("./testStrategy");

async function deployDiamondStandard() {
  const diamond = await deployDiamondContracts();
  const diamondContract = await ethers.getContractAt(
    "StrategyManager",
    diamond.address
  );

  const aaveVault = await deployVault(aWETH);
  const strategyAave = await deployStrategy(
    "StrategyAave",
    AavePoolWETH,
    aWETH,
    AaveWETH,
    diamond.address
  );
  await testStrategyRemovalAndAddition(
    diamondContract,
    strategyNameAave,
    strategyAave.address
  );
  await testStrategy(
    AaveWETH,
    diamondContract,
    strategyNameAave,
    amount,
    strategyAave
  );

  // const compoundVault = await deployVault(cWETH);
  // const strategyCompound = await deployStrategy(
  //   "StrategyCompound",
  //   CompoundPoolWETH,
  //   compoundVault.address,
  //   cWETH,
  //   CompoundWETH,
  //   diamond.address
  // );
  // await testStrategyRemovalAndAddition(
  //   diamondContract,
  //   strategyNameCompound,
  //   strategyCompound.address
  // );
  // await testStrategy(
  //   CompoundWETH,
  //   diamondContract,
  //   strategyNameCompound,
  //   amount,
  //   compoundVault,
  //   strategyCompound.address
  // );
}

if (require.main === module) {
  deployDiamondStandard()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployDiamondStandard = deployDiamondStandard;

// The strategy deposits in the ETH deposit vault using the given amount and issues shares to user based on ERC4626.
// Add any other necessary validations as required
// Write tests
// Modify the starter diamond stand contracts where adding a selector should replace if it already exists. If you look at the change modules functionality of diamond standard, it has different internal functions to add/replace/remove selectors. However, updating add to replace if exists would save us the call to replace specifically. This task checks how you can navigate other’s code.
