const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");
const { FacetNames } = require("./constants");

async function deployFacet(name) {
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

async function deployFacets() {
  console.log("Deploying facets");
  const cut = [];
  for (const name of FacetNames) {
    const facet = await deployFacet(name);
    cut.push(facet);
  }
  return cut;
}

async function deployDiamondCutFacet() {
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);
  return diamondCutFacet;
}

async function deployDiamond(contractOwner, diamondCutFacetAddress) {
  const Diamond = await ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy(contractOwner, diamondCutFacetAddress);
  await diamond.deployed();
  console.log("Diamond deployed:", diamond.address);
  return diamond;
}

async function deployDiamondInit() {
  const DiamondInit = await ethers.getContractFactory("DiamondInit");
  const diamondInit = await DiamondInit.deploy();
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);
  return diamondInit;
}

async function deployStrategyManager() {
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

async function initializeDiamond(cut, diamond, diamondInit) {
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

async function deployVault(depositToken) {
  const Vault = await ethers.getContractFactory("VaultToken");
  const vault = await Vault.deploy(depositToken);
  await vault.deployed();
  console.log("Vault deployed:", vault.address);
  return vault;
}

async function deployStrategy(
  strategyName,
  PoolWETH,
  vaultTokenAddress,
  poolToken,
  WETH,
  diamondContractAddress
) {
  const Strategy = await ethers.getContractFactory(strategyName);
  const strategy = await Strategy.deploy(
    PoolWETH,
    vaultTokenAddress,
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

  const diamondCutFacet = await deployDiamondCutFacet();

  const diamond = await deployDiamond(
    contractOwner.address,
    diamondCutFacet.address
  );

  const diamondInit = await deployDiamondInit();

  const cut = await deployFacets();
  const strategyManagerFacet = await deployStrategyManager();
  cut.push(strategyManagerFacet);
  await initializeDiamond(cut, diamond, diamondInit);

  return diamond;
}

module.exports = {
  deployFacet,
  deployFacets,
  deployStrategyManager,
  initializeDiamond,
  deployVault,
  deployStrategy,
  deployDiamondCutFacet,
  deployDiamond,
  deployDiamondInit,
  deployDiamondContracts,
};
