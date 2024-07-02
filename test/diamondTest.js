/* global describe it before ethers */

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets,
} = require("../scripts/libraries/diamond.js");
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
} = require("../scripts/constants.js");
const {
  deployStrategy,
  deployDiamondContracts,
  deployDiamondContractsForTest,
} = require("../scripts/helper.js");
const { assert } = require("chai");

const checkBalances = async (
  WETHTokenContract,
  diamondContract,
  strategyName,
  user,
  expectedWETHBalance,
  expectedVaultTokenBalance,
  isAbove
) => {
  const currentWETHBalance = await WETHTokenContract.balanceOf(user);
  const currentVaultTokenBalance = await diamondContract.balance(
    strategyName,
    user
  );
  assert.equal(currentWETHBalance.toNumber(), expectedWETHBalance);
  if (isAbove) {
    assert.isAbove(
      currentVaultTokenBalance.toNumber(),
      expectedVaultTokenBalance
    );
  } else {
    assert.isBelow(
      currentVaultTokenBalance.toNumber(),
      expectedVaultTokenBalance
    );
  }
};

describe("DiamondTest", async function () {
  let diamondAddress;
  let diamondCutFacet;
  let diamondLoupeFacet;
  let ownershipFacet;
  let tx;
  let receipt;
  let result;
  let diamond;
  const addresses = [];

  before(async function () {
    diamond = await deployDiamondContractsForTest();
    diamondAddress = diamond.address;

    diamondCutFacet = await ethers.getContractAt(
      "DiamondCutFacet",
      diamondAddress
    );
    diamondLoupeFacet = await ethers.getContractAt(
      "DiamondLoupeFacet",
      diamondAddress
    );
    ownershipFacet = await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    );
    diamond2 = await deployDiamondContracts();
    diamondAddress2 = diamond2.address;
  });

  it("should have three facets -- call to facetAddresses function", async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
    }

    assert.equal(addresses.length, 3);
  });

  it("facets should have the right function selectors -- call to facetFunctionSelectors function", async () => {
    let selectors = getSelectors(diamondCutFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0]);
    assert.sameMembers(result, selectors);
    selectors = getSelectors(diamondLoupeFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1]);
    assert.sameMembers(result, selectors);
    selectors = getSelectors(ownershipFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2]);
    assert.sameMembers(result, selectors);
  });

  it("selectors should be associated to facets correctly -- multiple calls to facetAddress function", async () => {
    assert.equal(
      addresses[0],
      await diamondLoupeFacet.facetAddress("0x1f931c1c")
    );
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress("0xcdffacc6")
    );
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress("0x01ffc9a7")
    );
    assert.equal(
      addresses[2],
      await diamondLoupeFacet.facetAddress("0xf2fde38b")
    );
  });

  it("should add strategyManager functions", async () => {
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    const strategyManager = await StrategyManager.deploy();
    await strategyManager.deployed();
    addresses.push(strategyManager.address);
    const selectors = getSelectors(strategyManager);
    tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: strategyManager.address,
          action: FacetCutAction.Add,
          functionSelectors: selectors,
        },
      ],
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 800000 }
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(
      strategyManager.address
    );
    assert.sameMembers(result, selectors);
  });

  it("should remove some strategyManager functions", async () => {
    const strategyManager = await ethers.getContractAt(
      "StrategyManager",
      diamondAddress
    );
    const functionsToKeep = [
      "deposit(string memory,uint256)",
      "withdraw(string memory,uint256 amount)",
      "balance(string memory,address)",
    ];
    const selectors = getSelectors(strategyManager).remove(functionsToKeep);
    tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: ethers.constants.AddressZero,
          action: FacetCutAction.Remove,
          functionSelectors: selectors,
        },
      ],
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 800000 }
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3]);
    assert.sameMembers(
      result,
      getSelectors(strategyManager).get(functionsToKeep)
    );
  });

  it("remove all functions and facets except 'diamondCut' and 'facets'", async () => {
    let selectors = [];
    let facets = await diamondLoupeFacet.facets();
    for (let i = 0; i < facets.length; i++) {
      selectors.push(...facets[i].functionSelectors);
    }
    selectors = removeSelectors(selectors, [
      "facets()",
      "diamondCut(tuple(address,uint8,bytes4[])[],address,bytes)",
    ]);
    tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: ethers.constants.AddressZero,
          action: FacetCutAction.Remove,
          functionSelectors: selectors,
        },
      ],
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 800000 }
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    facets = await diamondLoupeFacet.facets();
    assert.equal(facets.length, 2);
    assert.equal(facets[0][0], addresses[0]);
    assert.sameMembers(facets[0][1], ["0x1f931c1c"]);
    assert.equal(facets[1][0], addresses[1]);
    assert.sameMembers(facets[1][1], ["0x7a0ed627"]);
  });

  it("add most functions and facets", async () => {
    const diamondLoupeFacetSelectors = getSelectors(diamondLoupeFacet);
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    // Any number of functions from any number of facets can be added/replaced/removed in a
    // single transaction
    const cut = [
      {
        facetAddress: addresses[1],
        action: FacetCutAction.Add,
        functionSelectors: diamondLoupeFacetSelectors.remove(["facets()"]),
      },
      {
        facetAddress: addresses[2],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(ownershipFacet),
      },
      {
        facetAddress: addresses[3],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(StrategyManager),
      },
    ];
    tx = await diamondCutFacet.diamondCut(
      cut,
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 8000000 }
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    const facets = await diamondLoupeFacet.facets();
    const facetAddresses = await diamondLoupeFacet.facetAddresses();
    assert.equal(facetAddresses.length, 4);
    assert.equal(facets.length, 4);
    assert.sameMembers(facetAddresses, addresses);
    assert.equal(facets[0][0], facetAddresses[0], "first facet");
    assert.equal(facets[1][0], facetAddresses[1], "second facet");
    assert.equal(facets[2][0], facetAddresses[2], "third facet");
    assert.equal(facets[3][0], facetAddresses[3], "fourth facet");
    assert.sameMembers(
      facets[findAddressPositionInFacets(addresses[0], facets)][1],
      getSelectors(diamondCutFacet)
    );
    assert.sameMembers(
      facets[findAddressPositionInFacets(addresses[1], facets)][1],
      diamondLoupeFacetSelectors
    );
    assert.sameMembers(
      facets[findAddressPositionInFacets(addresses[2], facets)][1],
      getSelectors(ownershipFacet)
    );
    assert.sameMembers(
      facets[findAddressPositionInFacets(addresses[3], facets)][1],
      getSelectors(StrategyManager)
    );
  });

  it("should add and remove strategies", async () => {
    const diamondContract = await ethers.getContractAt(
      "StrategyManager",
      diamond2.address
    ); // Deploy Aave strategy

    const aaveETHDepositVault = await deployStrategy(
      "AaveETHDepositVault",
      AavePoolWETH,
      aWETH,
      AaveWETH,
      diamond2.address
    );

    // Add Aave strategy
    await (
      await diamondContract.addStrategy(
        strategyNameAave,
        aaveETHDepositVault.address
      )
    ).wait();

    // Verify strategy addition
    const addedStrategyAddress = await diamondContract.strategies(
      strategyNameAave
    );
    assert.equal(addedStrategyAddress, aaveETHDepositVault.address);

    // Remove Aave strategy
    await (await diamondContract.removeStrategy(strategyNameAave)).wait();

    // Verify strategy removal
    const removedStrategyAddress = await diamondContract.strategies(
      strategyNameAave
    );
    assert.equal(removedStrategyAddress, ethers.constants.AddressZero);
  });

  it("should test deposit, withdraw, and balance functions for Aave", async () => {
    const diamondContract = await ethers.getContractAt(
      "StrategyManager",
      diamond2.address
    );
    const [amount1, amount2] = [amount / 4, (3 * amount) / 4];

    const aaveETHDepositVault = await deployStrategy(
      "AaveETHDepositVault",
      AavePoolWETH,
      aWETH,
      AaveWETH,
      diamond2.address
    );

    await (
      await diamondContract.addStrategy(
        strategyNameAave,
        aaveETHDepositVault.address
      )
    ).wait();

    const WETHTokenContract = await ethers.getContractAt(
      "MintableWETH",
      AaveWETH
    );
    await (await WETHTokenContract.deposit({ value: amount })).wait();
    await (
      await WETHTokenContract.approve(diamondContract.address, amount)
    ).wait();

    const signer = await ethers.provider.getSigner();
    const user = await signer.getAddress();

    const initialWETHBalance = await WETHTokenContract.balanceOf(user);
    const initialVaultTokenBalance = await diamondContract.balance(
      strategyNameAave,
      user
    );
    assert.equal(initialVaultTokenBalance, 0);

    // Deposit amount1
    await (await diamondContract.deposit(strategyNameAave, amount1)).wait();
    await checkBalances(
      WETHTokenContract,
      diamondContract,
      strategyNameAave,
      user,
      initialWETHBalance - amount1,
      initialVaultTokenBalance,
      true
    );

    const vaultTokenBalanceAfterDeposit1 = await diamondContract.balance(
      strategyNameAave,
      user
    );

    // Deposit amount2
    await (await diamondContract.deposit(strategyNameAave, amount2)).wait();
    await checkBalances(
      WETHTokenContract,
      diamondContract,
      strategyNameAave,
      user,
      0,
      vaultTokenBalanceAfterDeposit1,
      true
    );

    const vaultTokenBalanceAfterDeposit2 = await diamondContract.balance(
      strategyNameAave,
      user
    );

    // Withdraw quarter amount
    const quarterAmount = amount / 4;
    await (
      await diamondContract.withdraw(strategyNameAave, quarterAmount)
    ).wait();
    await checkBalances(
      WETHTokenContract,
      diamondContract,
      strategyNameAave,
      user,
      quarterAmount,
      vaultTokenBalanceAfterDeposit2,
      false
    );

    const vaultTokenBalanceAfterWithdraw1 = await diamondContract.balance(
      strategyNameAave,
      user
    );

    // Withdraw remaining amount
    const remainingAmount = amount - quarterAmount;
    await (
      await diamondContract.withdraw(strategyNameAave, remainingAmount)
    ).wait();
    await checkBalances(
      WETHTokenContract,
      diamondContract,
      strategyNameAave,
      user,
      amount,
      vaultTokenBalanceAfterWithdraw1,
      false
    );

    const vaultTokenBalanceAfterWithdraw2 = await diamondContract.balance(
      strategyNameAave,
      user
    );

    // Remaining amount of shares that is the ROI for the user
    assert.isAbove(vaultTokenBalanceAfterWithdraw2, 0);
  });

  it("should test deposit, withdraw, and balance functions for Compound", async () => {
    const diamondContract = await ethers.getContractAt(
      "StrategyManager",
      diamond2.address
    );
    const [amount1, amount2] = [amount / 4, (3 * amount) / 4];

    const compoundETHDepositVault = await deployStrategy(
      "CompoundETHDepositVault",
      CompoundPoolWETH,
      cWETH,
      CompoundWETH,
      diamond2.address
    );

    await (
      await diamondContract.addStrategy(
        strategyNameCompound,
        compoundETHDepositVault.address
      )
    ).wait();

    const WETHTokenContract = await ethers.getContractAt(
      "MintableWETH",
      CompoundWETH
    );
    await (await WETHTokenContract.deposit({ value: amount })).wait();
    await (
      await WETHTokenContract.approve(diamondContract.address, amount)
    ).wait();

    const signer = await ethers.provider.getSigner();
    const user = await signer.getAddress();

    const initialWETHBalance = await WETHTokenContract.balanceOf(user);
    const initialVaultTokenBalance = await diamondContract.balance(
      strategyNameCompound,
      user
    );
    assert.equal(initialVaultTokenBalance, 0);

    // Deposit amount1
    await (await diamondContract.deposit(strategyNameCompound, amount1)).wait();
    await checkBalances(
      WETHTokenContract,
      diamondContract,
      strategyNameCompound,
      user,
      initialWETHBalance - amount1,
      initialVaultTokenBalance,
      true
    );

    const vaultTokenBalanceAfterDeposit1 = await diamondContract.balance(
      strategyNameCompound,
      user
    );

    // Deposit amount2
    await (await diamondContract.deposit(strategyNameCompound, amount2)).wait();
    await checkBalances(
      WETHTokenContract,
      diamondContract,
      strategyNameCompound,
      user,
      initialWETHBalance - amount,
      vaultTokenBalanceAfterDeposit1,
      true
    );

    const vaultTokenBalanceAfterDeposit2 = await diamondContract.balance(
      strategyNameCompound,
      user
    );

    // Withdraw quarter amount
    const quarterAmount = amount / 4;
    await (
      await diamondContract.withdraw(strategyNameCompound, quarterAmount)
    ).wait();
    await checkBalances(
      WETHTokenContract,
      diamondContract,
      strategyNameCompound,
      user,
      initialWETHBalance - amount + quarterAmount,
      vaultTokenBalanceAfterDeposit2,
      false
    );

    const vaultTokenBalanceAfterWithdraw1 = await diamondContract.balance(
      strategyNameCompound,
      user
    );

    // Withdraw remaining amount
    const remainingAmount = amount - quarterAmount;
    await (
      await diamondContract.withdraw(strategyNameCompound, remainingAmount)
    ).wait();
    await checkBalances(
      WETHTokenContract,
      diamondContract,
      strategyNameCompound,
      user,
      initialWETHBalance,
      vaultTokenBalanceAfterWithdraw1,
      false
    );

    // Remaining amount of shares that is the ROI for the user
    const vaultTokenBalanceAfterWithdraw2 = await diamondContract.balance(
      strategyNameCompound,
      user
    );
    assert.isAbove(vaultTokenBalanceAfterWithdraw2, 0);
  });

  it("Using add to replace current facet with a new one", async () => {
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    const strategyManager = await StrategyManager.deploy();
    await strategyManager.deployed();
    addresses.push(strategyManager.address);
    const selectors = getSelectors(strategyManager);
    tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: strategyManager.address,
          action: FacetCutAction.Add,
          functionSelectors: selectors,
        },
      ],
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 800000 }
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(
      strategyManager.address
    );
    assert.sameMembers(result, selectors);
  });
});
