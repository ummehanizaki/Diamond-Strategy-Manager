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

async function testStrategyRemovalAndAddition(
  diamondContract,
  strategyName,
  strategyAddress
) {
  await expect(
    diamondContract.addStrategy(strategyName, strategyAddress)
  ).to.emit(diamondContract, "StrategyAdded");
  await expect(diamondContract.removeStrategy(strategyName)).to.emit(
    diamondContract,
    "StrategyRemoved"
  );
  // const isStrategyRemoved = await diamondContract.isStrategy(strategyName);
  // if (!isStrategyRemoved) {
  //   console.log(`${strategyName} strategy removal successful`);
  // } else {
  //   console.log(`${strategyName} strategy still exists (unexpected)`);
  //   return;
  // }
  console.log(`${strategyName} strategy addition initiated`);
  await expect(
    diamondContract.addStrategy(strategyName, strategyAddress)
  ).to.emit(diamondContract, "StrategyAdded");
  // const isStrategyAdded = await diamondContract.isStrategy(strategyName);
  // console.log(`${strategyName} strategy added:`, isStrategyAdded);
}

async function testStrategy(
  weth,
  diamondContract,
  strategyName,
  amount,
  vault,
  strategyAddress
) {
  const WETHTokenContract = await ethers.getContractAt("MintableWETH", weth);
  const mintWETH = await WETHTokenContract.deposit({ value: amount });
  await mintWETH.wait();
  const approveWETH = await WETHTokenContract.approve(
    diamondContract.address,
    amount
  );
  await approveWETH.wait();
  const depositTxn = await diamondContract.deposit(strategyName, amount);
  await depositTxn.wait();
  const approveVaultToken = await vault.approve(strategyAddress, amount);
  await approveVaultToken.wait();
  const withdrawTxn = await diamondContract.withdraw(strategyName, amount);
  await withdrawTxn.wait();
}

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
    aaveVault.address,
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
    aaveVault,
    strategyAave.address
  );

  const compoundVault = await deployVault(cWETH);
  const strategyCompound = await deployStrategy(
    "StrategyCompound",
    CompoundPoolWETH,
    compoundVault.address,
    cWETH,
    CompoundWETH,
    diamond.address
  );
  await testStrategyRemovalAndAddition(
    diamondContract,
    strategyNameCompound,
    strategyCompound.address
  );
  await testStrategy(
    CompoundWETH,
    diamondContract,
    strategyNameCompound,
    amount,
    compoundVault,
    strategyCompound.address
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

// The strategy deposits in the ETH deposit vault using the given amount and issues shares to user based on ERC4626.
// Add any other necessary validations as required
// Write tests
// Modify the starter diamond stand contracts where adding a selector should replace if it already exists. If you look at the change modules functionality of diamond standard, it has different internal functions to add/replace/remove selectors. However, updating add to replace if exists would save us the call to replace specifically. This task checks how you can navigate other’s code.
