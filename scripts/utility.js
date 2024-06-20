// deployment.js

/* global ethers */
/* eslint prefer-const: "off" */

const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");
const { expect } = require("chai");
const {
  FacetNames,
  strategyName1,
  strategyName2,
  cToken,
  WETHGateway2,
  WETH2,
  valueInWei,
  WETHGateway,
  aaveToken,
  WETH,
} = require("./constants");

// Deployment Functions
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
  console.log("Initializing Diamond Cut:", cut);
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

async function deployVaultToken(token) {
  const VaultToken = await ethers.getContractFactory("VaultToken");
  const vaultToken = await VaultToken.deploy(token);
  await vaultToken.deployed();
  console.log("VaultToken deployed:", vaultToken.address);
  return vaultToken;
}

async function deployStrategy(
  name,
  WETHGate,
  vaultTokenAddress,
  cToken,
  WETH2
) {
  const Strategy = await ethers.getContractFactory(name);
  const strategy = await Strategy.deploy(
    WETHGate,
    vaultTokenAddress,
    cToken,
    WETH2
  );
  await strategy.deployed();
  console.log("Strategy deployed:", strategy.address);
  return strategy;
}

module.exports = {
  deployFacet,
  deployFacets,
  deployStrategyManager,
  initializeDiamond,
  deployVaultToken,
  deployStrategy,
  deployDiamondCutFacet,
  deployDiamond,
  deployDiamondInit,
};
