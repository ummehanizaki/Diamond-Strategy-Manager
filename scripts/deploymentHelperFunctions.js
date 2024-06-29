const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");
const { FacetNames } = require("./constants");

async function _deployFacet(name) {
  const Facet = await ethers.getContractFactory(name);
  const facet = await Facet.deploy();
  await facet.deployed();
  console.log(`${name} deployed: ${facet.address}`);
  return {
    facetAddress: facet.address,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(facet),
  };
}

async function _deployFacets() {
  console.log("Deploying facets");
  const cut = [];
  for (const name of FacetNames) {
    const facet = await _deployFacet(name);
    cut.push(facet);
  }
  return cut;
}

async function _deployDiamondCutFacet() {
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);
  return diamondCutFacet;
}

async function _deployDiamond(contractOwner, diamondCutFacetAddress) {
  const Diamond = await ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy(contractOwner, diamondCutFacetAddress);
  await diamond.deployed();
  console.log("Diamond deployed:", diamond.address);
  return diamond;
}

async function _deployDiamondInit() {
  const DiamondInit = await ethers.getContractFactory("DiamondInit");
  const diamondInit = await DiamondInit.deploy();
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);
  return diamondInit;
}

async function _deployStrategyManager() {
  const StrategyManager = await ethers.getContractFactory("StrategyManager");
  const strategyManager = await StrategyManager.deploy();
  await strategyManager.deployed();
  console.log("StrategyManager deployed:", strategyManager.address);
  return {
    facetAddress: strategyManager.address,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(strategyManager),
  };
}

async function _initializeDiamond(cut, diamond, diamondInit) {
  console.log("Initializing Diamond Cut:");
  const diamondCut = await ethers.getContractAt("IDiamondCut", diamond.address);
  const functionCall = diamondInit.interface.encodeFunctionData("init");
  const tx = await diamondCut.diamondCut(
    cut,
    diamondInit.address,
    functionCall
  );
  console.log("Diamond initialization tx: ", tx.hash);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw new Error(`Diamond initialization failed: ${tx.hash}`);
  }
  console.log("Completed diamond initialization");
}

async function deployStrategy(
  strategyName,
  PoolWETH,
  poolToken,
  WETH,
  diamondContractAddress
) {
  const Strategy = await ethers.getContractFactory(strategyName);
  const strategy = await Strategy.deploy(
    PoolWETH,
    poolToken,
    WETH,
    diamondContractAddress
  );
  await strategy.deployed();
  console.log("Strategy deployed:", strategy.address);
  return strategy;
}

async function deployDiamondContracts() {
  const accounts = await ethers.getSigners();
  const contractOwner = accounts[0];

  const diamondCutFacet = await _deployDiamondCutFacet();

  const diamond = await _deployDiamond(
    contractOwner.address,
    diamondCutFacet.address
  );

  const diamondInit = await _deployDiamondInit();

  const cut = await _deployFacets();
  const strategyManagerFacet = await _deployStrategyManager();
  cut.push(strategyManagerFacet);
  await _initializeDiamond(cut, diamond, diamondInit);

  return diamond;
}

module.exports = {
  deployStrategy,
  deployDiamondContracts,
};
