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
} = require("../scripts/deploymentHelperFunctions.js");
const { assert } = require("chai");

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
    );

    const aaveETHDepositVault = await deployStrategy(
      "AaveETHDepositVault",
      AavePoolWETH,
      aWETH,
      AaveWETH,
      diamond2.address
    );
    const txn = await diamondContract.addStrategy(
      strategyNameAave,
      aaveETHDepositVault.address
    );
    await txn.wait();

    const addedStrategyAddress = await diamondContract.strategies(
      strategyNameAave
    );

    assert.equal(addedStrategyAddress, aaveETHDepositVault.address);

    const txn2 = await diamondContract.removeStrategy(strategyNameAave);
    await txn2.wait();

    const removedStrategyAddress = await diamondContract.strategies(
      strategyNameAave
    );

    assert.equal(
      removedStrategyAddress,
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("should test deposit, withdraw and balance functions for Aave", async () => {
    const diamondContract = await ethers.getContractAt(
      "StrategyManager",
      diamond2.address
    );

    const aaveETHDepositVault = await deployStrategy(
      "AaveETHDepositVault",
      AavePoolWETH,
      aWETH,
      AaveWETH,
      diamond2.address
    );
    const txn = await diamondContract.addStrategy(
      strategyNameAave,
      aaveETHDepositVault.address
    );
    await txn.wait();

    const WETHTokenContract = await ethers.getContractAt(
      "MintableWETH",
      AaveWETH
    );
    const mintWETH = await WETHTokenContract.deposit({ value: amount });
    await mintWETH.wait();
    const approveWETH = await WETHTokenContract.approve(
      diamondContract.address,
      amount
    );
    await approveWETH.wait();

    var signer = await ethers.provider.getSigner();
    user = await signer.getAddress();

    const initialVaultTokenBalance = await diamondContract.balance(
      strategyNameAave,
      user
    );
    assert.equal(initialVaultTokenBalance, 0);
    const initialWETHBalance = await WETHTokenContract.balanceOf(user);

    const depositTxn = await diamondContract.deposit(strategyNameAave, amount);
    await depositTxn.wait();

    const afterDepositWETHBalance = await WETHTokenContract.balanceOf(user);
    const afterDepositVaultTokenBalance = await diamondContract.balance(
      strategyNameAave,
      user
    );

    assert.equal(afterDepositWETHBalance, initialWETHBalance - amount);
    assert.isAbove(afterDepositVaultTokenBalance, initialVaultTokenBalance);
  });

  it("should test deposit, withdraw and balance functions for Compound", async () => {
    const diamondContract = await ethers.getContractAt(
      "StrategyManager",
      diamond2.address
    );

    const compoundETHDepositVault = await deployStrategy(
      "CompoundETHDepositVault",
      CompoundPoolWETH,
      cWETH,
      CompoundWETH,
      diamond2.address
    );
    const txn = await diamondContract.addStrategy(
      strategyNameCompound,
      compoundETHDepositVault.address
    );
    await txn.wait();

    const WETHTokenContract = await ethers.getContractAt(
      "MintableWETH",
      CompoundWETH
    );
    const mintWETH = await WETHTokenContract.deposit({ value: amount });
    await mintWETH.wait();
    const approveWETH = await WETHTokenContract.approve(
      diamondContract.address,
      amount
    );
    await approveWETH.wait();

    var signer = await ethers.provider.getSigner();
    user = await signer.getAddress();

    const initialVaultTokenBalance = await diamondContract.balance(
      strategyNameCompound,
      user
    );
    assert.equal(initialVaultTokenBalance, 0);
    const initialWETHBalance = await WETHTokenContract.balanceOf(user);

    const depositTxn = await diamondContract.deposit(
      strategyNameCompound,
      amount
    );
    await depositTxn.wait();

    const afterDepositWETHBalance = await WETHTokenContract.balanceOf(user);
    const afterDepositVaultTokenBalance = await diamondContract.balance(
      strategyNameCompound,
      user
    );

    assert.equal(afterDepositWETHBalance, initialWETHBalance - amount);
    assert.isAbove(afterDepositVaultTokenBalance, initialVaultTokenBalance);
  });
});
