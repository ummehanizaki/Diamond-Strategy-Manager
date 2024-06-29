const { ethers } = require("hardhat");
const {
  deployStrategy,
  deployDiamondContracts,
} = require("./deploymentHelperFunctions");
const { expect } = require("chai");
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
const { testDiamondStandard } = require("./testDiamondStandard");

async function deployDiamondStandard() {
  const diamond = await deployDiamondContracts();
  const diamondContract = await ethers.getContractAt(
    "StrategyManager",
    diamond.address
  );

  const aaveETHDepositVault = await deployStrategy(
    "AaveETHDepositVault",
    AavePoolWETH,
    aWETH,
    AaveWETH,
    diamond.address
  );
  await testDiamondStandard(
    AaveWETH,
    diamondContract,
    strategyNameAave,
    aaveETHDepositVault,
    amount
  );

  const compoundETHDepositVault = await deployStrategy(
    "CompoundETHDepositVault",
    CompoundPoolWETH,
    cWETH,
    CompoundWETH,
    diamond.address
  );
  await testDiamondStandard(
    CompoundWETH,
    diamondContract,
    strategyNameCompound,
    compoundETHDepositVault,
    amount
  );
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
