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

  // Mint WETH
  await (await WETHTokenContract.deposit({ value: amount })).wait();

  // Approve WETH
  await (
    await WETHTokenContract.approve(diamondContract.address, amount)
  ).wait();

  // Get signer address
  const signerAddress = await (await ethers.provider.getSigner()).getAddress();

  // Check initial balance
  const initialVaultTokenBalance = await diamondContract.balance(
    strategyName,
    signerAddress
  );
  expect(initialVaultTokenBalance).to.equal(0);

  // Test deposit
  await _testDeposit(
    WETHTokenContract,
    diamondContract,
    strategyName,
    signerAddress,
    amount
  );

  // Test withdraw
  await _testWithdraw(
    WETHTokenContract,
    diamondContract,
    strategyName,
    signerAddress,
    amount
  );

  // Check final balance
  const finalVaultTokenBalance = await diamondContract.balance(
    strategyName,
    signerAddress
  );
  expect(finalVaultTokenBalance).to.be.above(0);
}

module.exports = {
  testDiamondStandard,
  addStrategy,
};
