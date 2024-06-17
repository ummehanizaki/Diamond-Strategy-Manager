/* global ethers */
/* eslint prefer-const: "off" */

const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')
const hre = require("hardhat");
const { expect } = require("chai");

async function removeAndAddStrategy(strategyName, strategyAddress, diamondContract) {
  try {
    // // Remove the strategy
    // console.log(`${strategyName} strategy removal initiated`);

    // tx2 = await diamondContract.removeStrategy(strategyName);
    // console.log(tx2.events)
    // console.log(`${strategyName} strategy removal initiated`);

    // Check if removal was successful before adding again
    const isStrategyRemoved = await diamondContract.isStrategy(strategyName);
    
    if (!isStrategyRemoved) {
      console.log(`${strategyName} strategy removal successful`);
    } else {
      console.log(`${strategyName} strategy still exists (unexpected)`);
      return; 
    }

    // Add the strategy back (assuming successful removal)
    await diamondContract.addStrategy(strategyName, strategyAddress);
    console.log(`${strategyName} strategy addition initiated`);

    await new Promise((resolve) => setTimeout(resolve, 5000)); // 3 second delay

    const currentStrategy = await diamondContract.isStrategy(strategyName);
    console.log(`${strategyName} current strategy:`, currentStrategy);
  } catch (error) {
    console.error("Error removing and adding strategy:", error);
  }
}

async function testFunctions(strategyName, strategyAddress, amount, diamondContract, contractOwner) {
  try {
    await removeAndAddStrategy(strategyName, strategyAddress);
    console.log("Strategy removed and added successfully");

    const valueInWei = ethers.utils.parseEther("0.00001"); 
    const tx1 = await diamondContract.deposit(contractOwner.address,valueInWei,{ value: valueInWei });
    const r = await tx1.wait()
    console.log(r.events)
    await expect(diamondContract.deposit(contractOwner.address,valueInWei,{ value: valueInWei })).to.emit(diamondContract, "Deposited")

    console.log("Deposit transaction sent");
  } catch (error) {
    console.error("Error:", error);
  }
}

async function deployDiamond () {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]

  const WETHGateway = "0x387d311e47e80b498169e6fb51d3193167d89F7D"
  const aaveToken = "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830"
  // Ref Txn hash : https://sepolia.etherscan.io/tx/0xe0a2750c460a11630a5385e4726b5bdf56ca3574203a594659286efa37beed02

  // deploy vault token
  const VaultToken = await ethers.getContractFactory('VaultToken')
  const vaultToken = await VaultToken.deploy(aaveToken)
  await vaultToken.deployed()
  console.log('VaultToken deployed:', vaultToken.address)

  // deploy Aave strategy
  const StrategyAave = await ethers.getContractFactory('StrategyAave')
  const strategyAave = await StrategyAave.deploy(WETHGateway,vaultToken.address, aaveToken)
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

  const valueInWei = ethers.utils.parseEther("0.00001"); 

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
  tx2 = await diamondContract1.removeStrategy(strategyName);
  const r2 = await tx2.wait()
  // console.log(r2.events)
  await expect(diamondContract1.removeStrategy(strategyName)).to.emit(diamondContract1, "StrategyRemoved")
  const isStrategyRemoved = await diamondContract1.isStrategy(strategyName);
  if (!isStrategyRemoved) {
    console.log(`${strategyName} strategy removal successful`);
  } else {
    console.log(`${strategyName} strategy still exists (unexpected)`);
    return; 
  }
  // Add the strategy back (assuming successful removal)
  console.log(`${strategyName} strategy addition initiated`);
  // tx3 = await diamondContract1.addStrategy(strategyName, strategyAave.address);
  // const r3 = await tx3.wait()
  // console.log(r3.events)
  await expect(diamondContract1.addStrategy(strategyName, strategyAave.address)).to.emit(diamondContract1, "StrategyAdded")
  const currentStrategy = await diamondContract1.isStrategy(strategyName);
  console.log(`${strategyName} current strategy:`, currentStrategy.address);

  const tokenx = await ethers.getContractAt(
    "TokenX",
    aaveToken
  );  

  tx4 = await diamondContract1.deposit(strategyName, valueInWei, { value: valueInWei });
  const r4 = await tx4.wait()
  // console.log(r4)

  tx5 = await tokenx.balanceOf(strategyAave.address);
  console.log(ethers.utils.formatEther(tx5))
  // console.log(tx5)

  // tx5 = await vaultToken.approve(strategyAave, valueInWei);
  // const r5 = await tx5.wait()
  // console.log(r5)

  // tx5 = await vaultToken.previewWithdraw(valueInWei);
  // console.log(ethers.utils.formatEther(tx5))
  // console.log(tx5)
  
  tx6 = await diamondContract1.withdraw(strategyName, valueInWei);
  const r6 = await tx6.wait()
  console.log(r6)

  // await testFunctions("Aave", strategyAave.address, 10000000, diamondContract1, contractOwner);
  // await testFunctions("Compound", "0x2dCD1CD26Be25A3F2fD4a2E4c9D8b67F9bb1c91B", 10000000);
  // return diamondContract.address

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
