const { expect } = require("chai");

async function _testStrategyAddition(
  diamondContract,
  strategyName,
  strategyAddress
) {
  await expect(
    diamondContract.addStrategy(strategyName, strategyAddress)
  ).to.emit(diamondContract, "StrategyAdded");

  const addedStrategyAddress = await diamondContract.strategies(strategyName);
  if (addedStrategyAddress === strategyAddress) {
    console.log(`${strategyName} strategy addition successful`);
  } else {
    console.error(`${strategyName} strategy addition failed (unexpected)`);
    throw new Error("Strategy addition failed");
  }
}

async function _testStrategyRemoval(diamondContract, strategyName) {
  await expect(diamondContract.removeStrategy(strategyName)).to.emit(
    diamondContract,
    "StrategyRemoved"
  );

  const removedStrategyAddress = await diamondContract.strategies(strategyName);
  if (removedStrategyAddress === "0x0000000000000000000000000000000000000000") {
    console.log(`${strategyName} strategy removal successful`);
  } else {
    console.error(`${strategyName} strategy removal failed (unexpected)`);
    throw new Error("Strategy removal failed");
  }
}

async function testStrategyRemovalAndAddition(
  diamondContract,
  strategyName,
  strategyAddress
) {
  console.log(
    `Starting test for ${strategyName} strategy addition and removal`
  );
  await _testStrategyAddition(diamondContract, strategyName, strategyAddress);
  console.log(`Adding ${strategyName} strategy`);

  await _testStrategyRemoval(diamondContract, strategyName);
  console.log(`Removing ${strategyName} strategy`);

  console.log(`Re-adding ${strategyName} strategy`);
  await _testStrategyAddition(diamondContract, strategyName, strategyAddress);

  console.log(
    `${strategyName} strategy addition and removal test completed successfully`
  );
}

async function testStrategy(
  weth,
  diamondContract,
  strategyName,
  amount,
  strategy
) {
  const WETHTokenContract = await ethers.getContractAt("MintableWETH", weth);
  const mintWETH = await WETHTokenContract.deposit({ value: amount });
  await mintWETH.wait();

  const approveWETH = await WETHTokenContract.approve(
    diamondContract.address,
    amount
  );
  await approveWETH.wait();
  const depositTxn = await diamondContract.deposit(strategyName, amount / 2);
  await depositTxn.wait();

  const depositTxn1 = await diamondContract.deposit(strategyName, amount / 2);
  await depositTxn1.wait();

  const shares = strategy.previewWithdraw(amount);
  var amountToApprove = 0;
  if (shares > amount) {
    amountToApprove = shares;
  } else {
    amountToApprove = amount;
  }
  const approveVaultToken = await strategy.approve(
    diamondContract.address,
    amountToApprove
  );

  await approveVaultToken.wait();
  const withdrawTxn = await diamondContract.withdraw(strategyName, amount / 2);
  await withdrawTxn.wait();
  const withdrawTxn1 = await diamondContract.withdraw(strategyName, amount / 2);
  await withdrawTxn1.wait();
}

module.exports = {
  testStrategyRemovalAndAddition,
  testStrategy,
};
