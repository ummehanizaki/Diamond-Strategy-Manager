const { ethers } = require("hardhat");
const {
  deployStrategy,
  deployDiamondContracts,
} = require("./deploymentHelperFunctions");
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
const { testDiamondStandard, addStrategy } = require("./testDiamondStandard");

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
  await addStrategy(
    diamondContract,
    strategyNameAave,
    aaveETHDepositVault.address
  );
  const compoundETHDepositVault = await deployStrategy(
    "CompoundETHDepositVault",
    CompoundPoolWETH,
    cWETH,
    CompoundWETH,
    diamond.address
  );
  await addStrategy(
    diamondContract,
    strategyNameCompound,
    compoundETHDepositVault.address
  );

  //Optional Basic Testing
  await testDiamondStandard(
    CompoundWETH,
    diamondContract,
    strategyNameCompound,
    compoundETHDepositVault,
    amount
  );
  await testDiamondStandard(
    AaveWETH,
    diamondContract,
    strategyNameAave,
    aaveETHDepositVault,
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
