/* global ethers */
/* eslint prefer-const: "off" */

const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')
const hre = require("hardhat");
const { expect } = require("chai");

async function deployDiamond () {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]

  const WETHGateway = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951"
  const aaveToken = "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830"
  const WETH = "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c"
  // Ref Txn hash : https://sepolia.etherscan.io/tx/0xe0a2750c460a11630a5385e4726b5bdf56ca3574203a594659286efa37beed02

  // deploy vault token
  const VaultToken = await ethers.getContractFactory('VaultToken')
  const vaultToken = await VaultToken.deploy(aaveToken)
  await vaultToken.deployed()
  console.log('VaultToken deployed:', vaultToken.address)

  // deploy Aave strategy
  const StrategyAave = await ethers.getContractFactory('StrategyAave')
  const strategyAave = await StrategyAave.deploy(WETHGateway,vaultToken.address, aaveToken, WETH)
  await strategyAave.deployed()
  console.log('StrategyAave deployed:', strategyAave.address)

  // deploy DiamondCutFacdeployet
  const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
  const diamondCutFacet = await DiamondCutFacet.deploy()
  await diamondCutFacet.deployed()
  console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

  // deploy Diamond
  const Diamond = await ethers.getContractFactory('Diamond')
  const diamond = await Diamond.deploy(contractOwner.address, diamondCutFacet.address)
  await diamond.deployed()
  console.log('Diamond deployed:', diamond.address)

  // deploy DiamondInit
  const DiamondInit = await ethers.getContractFactory('DiamondInit')
  const diamondInit = await DiamondInit.deploy()
  await diamondInit.deployed()
  console.log('DiamondInit deployed:', diamondInit.address)

  const valueInWei = 10000000000000; 

  // deploy facets
  console.log('Deploying facets')
  const FacetNames = [
    'DiamondLoupeFacet',
    'OwnershipFacet'
  ]
  const cut = []
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName)
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetName} deployed: ${facet.address}`)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  const StrategyManager = await ethers.getContractFactory('StrategyManager')
  const strategyManager = await StrategyManager.deploy()
  await strategyManager.deployed()
  console.log('StrategyManager deployed:', strategyManager.address)
  cut.push({
    facetAddress: strategyManager.address,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(strategyManager)
  })

  // upgrade diamond with facets
  console.log('Diamond Cut:', cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address);
  let tx
  let receipt
  // call to init function
  let functionCall = diamondInit.interface.encodeFunctionData('init')
  tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
  console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }

  console.log('Completed diamond cut')

  const diamondContract1 = await ethers.getContractAt(
    "StrategyManager",
    diamond.address
  );

  const strategyName = "Aave"
  await expect(diamondContract1.removeStrategy(strategyName)).to.emit(diamondContract1, "StrategyRemoved")
  const isStrategyRemoved = await diamondContract1.isStrategy(strategyName);
  if (!isStrategyRemoved) {
    console.log(`${strategyName} strategy removal successful`);
  } else {
    console.log(`${strategyName} strategy still exists (unexpected)`);
    return; 
  }
  console.log(`${strategyName} strategy addition initiated`);
  await expect(diamondContract1.addStrategy(strategyName, strategyAave.address)).to.emit(diamondContract1, "StrategyAdded")
  const currentStrategy = await diamondContract1.isStrategy(strategyName);
  console.log(`${strategyName} current strategy:`, currentStrategy);

  const tokenx = await ethers.getContractAt(
    "TokenX",
    aaveToken
  );  

  const wethTokenX = await ethers.getContractAt(
    "WETH9",
    WETH
  ); 

  tx2 = await wethTokenX.deposit({ value: valueInWei });
  tx3 = await wethTokenX.approve(diamondContract1.address, valueInWei);
  const r3 = await tx3.wait()
  // console.log(r3)

  tx4 = await diamondContract1.deposit(strategyName, valueInWei);
  const r4 = await tx4.wait()
  // console.log(r4)

  tx5 = await tokenx.balanceOf(strategyAave.address);
  console.log(ethers.utils.formatEther(tx5))
  // console.log(tx5)

  tx6 = await vaultToken.approve(strategyAave.address, valueInWei);
  const r6 = await tx6.wait()
  // console.log(r6)

  tx7 = await diamondContract1.withdraw(strategyName, valueInWei);
  const r7 = await tx7.wait()
  // console.log(r7)


  const cToken = "0x2943ac1216979aD8dB76D9147F64E61adc126e96"

  const WETHGateway2 = "0x2943ac1216979aD8dB76D9147F64E61adc126e96"
  const WETH2 = "0x2D5ee574e710219a521449679A4A7f2B43f046ad"
  // Ref Txn hash : https://sepolia.etherscan.io/tx/0xe0a2750c460a11630a5385e4726b5bdf56ca3574203a594659286efa37beed02

  // deploy vault token
  const VaultToken2 = await ethers.getContractFactory('VaultToken')
  const vaultToken2 = await VaultToken2.deploy(cToken)
  await vaultToken2.deployed()
  console.log('VaultToken deployed:', vaultToken2.address)

  // deploy Aave strategy
  const StrategyCompound = await ethers.getContractFactory('StrategyCompound')
  const strategyCompound = await StrategyCompound.deploy(WETHGateway2,vaultToken2.address, cToken, WETH2)
  await strategyCompound.deployed()
  console.log('StrategyCompound deployed:', strategyCompound.address)

  const strategyName2 = "Compound"
  await expect(diamondContract1.addStrategy(strategyName2, strategyCompound.address)).to.emit(diamondContract1, "StrategyAdded")

  const isStrategyRemoved2 = await diamondContract1.isStrategy(strategyName2);
  if (isStrategyRemoved2) {
    console.log(`${strategyName2} strategy addition successful`);
  } else {
    console.log(`${strategyName2} strategy does not exist (unexpected)`);
    return; 
  }
 
  const wethTokenX2 = await ethers.getContractAt(
    "WETH9",
    WETH2
  );  
  const cTokenContract = await ethers.getContractAt(
    "TokenX",
    cToken
  ); 

  tx22 = await wethTokenX2.deposit({ value: valueInWei });
  tx32 = await wethTokenX2.approve(diamondContract1.address, valueInWei);
  const r32 = await tx32.wait()
  // console.log(r32)

  tx42 = await diamondContract1.deposit(strategyName2, valueInWei);
  const r42 = await tx42.wait()
  // console.log(r42)

  tx52 = await diamondContract1.balance(strategyName2, contractOwner.address);
  console.log(ethers.utils.formatEther(tx52))
  console.log(tx52)

  tx322 = await cTokenContract.allow(diamondContract1.address, true);
  const tx344 = await tx322.wait()

  tx312 = await cTokenContract.allow(strategyCompound.address, true);
  const tx372 = await tx312.wait()
  tx62 = await vaultToken2.approve(strategyCompound.address, valueInWei);
  const r62 = await tx62.wait()
  // console.log(r6)

  tx72 = await diamondContract1.withdraw(strategyName2, valueInWei);
  const r72 = await tx72.wait()

}


if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}
exports.deployDiamond = deployDiamond
