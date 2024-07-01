const { expect } = require("chai");
async function addStrategy(diamondContract, strategyName, strategyAddress) {
  txn = await diamondContract.addStrategy(strategyName, strategyAddress);
  txn.wait();
  const addedStrategyAddress = await diamondContract.strategies(strategyName);
  if (addedStrategyAddress === strategyAddress) {
    console.log(`${strategyName} strategy addition successful`);
  } else {
    console.error(`${strategyName} strategy addition failed (unexpected)`);
    throw new Error("Strategy addition failed");
  }
}

async function _testDeposit(
  tokenContract,
  diamondContract,
  strategyName,
  strategy,
  user,
  amount
) {
  const initialWETHBalance = await tokenContract.balanceOf(user);
  const initialVaultTokenBalance = await diamondContract.balance(
    strategyName,
    user
  );

  const depositTxn = await diamondContract.deposit(strategyName, amount);
  await depositTxn.wait();

  const afterDepositWETHBalance = await tokenContract.balanceOf(user);
  const afterDepositVaultTokenBalance = await diamondContract.balance(
    strategyName,
    user
  );

  expect(afterDepositWETHBalance).to.be.equal(initialWETHBalance - amount);
  expect(afterDepositVaultTokenBalance).to.be.above(initialVaultTokenBalance);
}

async function _testWithdraw(
  tokenContract,
  diamondContract,
  strategyName,
  strategy,
  user,
  amount
) {
  const initialWETHBalance = await tokenContract.balanceOf(user);
  const initialVaultTokenBalance = await diamondContract.balance(
    strategyName,
    user
  );

  const withdrawTxn = await diamondContract.withdraw(strategyName, amount);
  await withdrawTxn.wait();

  const afterWithdrawWETHBalance = await tokenContract.balanceOf(user);
  const afterWithdrawVaultTokenBalance = await diamondContract.balance(
    strategyName,
    user
  );

  expect(afterWithdrawWETHBalance.toNumber()).to.be.equal(
    initialWETHBalance.toNumber() + amount
  );
  expect(afterWithdrawVaultTokenBalance.toNumber()).to.be.lessThan(
    initialVaultTokenBalance.toNumber()
  );
}

async function testDiamondStandard(
  weth,
  diamondContract,
  strategyName,
  strategy,
  amount
) {
  const WETHTokenContract = await ethers.getContractAt("MintableWETH", weth);
  const mintWETH = await WETHTokenContract.deposit({ value: amount });
  await mintWETH.wait();
  const approveWETH = await WETHTokenContract.approve(
    diamondContract.address,
    amount
  );
  await approveWETH.wait();

  var signer = await ethers.provider.getSigner();
  signer = await signer.getAddress();
  console.log(signer);

  amount1 = amount / 4;
  amount2 = amount - amount1;

  const initialVaultTokenBalance = await diamondContract.balance(
    strategyName,
    signer
  );
  expect(initialVaultTokenBalance).to.be.equal(0);

  await _testDeposit(
    WETHTokenContract,
    diamondContract,
    strategyName,
    strategy,
    signer,
    amount1
  );

  await _testDeposit(
    WETHTokenContract,
    diamondContract,
    strategyName,
    strategy,
    signer,
    amount2
  );

  await _testWithdraw(
    WETHTokenContract,
    diamondContract,
    strategyName,
    strategy,
    signer,
    amount1
  );

  await _testWithdraw(
    WETHTokenContract,
    diamondContract,
    strategyName,
    strategy,
    signer,
    amount2
  );

  const finalVaultTokenBalance = await diamondContract.balance(
    strategyName,
    signer
  );
  expect(finalVaultTokenBalance).to.be.above(0);
}

module.exports = {
  testDiamondStandard,
  _testDeposit,
  _testWithdraw,
  addStrategy,
};
