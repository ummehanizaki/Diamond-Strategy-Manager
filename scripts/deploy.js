/* global ethers */
/* eslint prefer-const: "off" */

const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')
const hre = require("hardhat");

async function deployDiamond () {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]

  // deploy aave strategy
  const WETHGateway = "0x387d311e47e80b498169e6fb51d3193167d89F7D"
  const aaveToken = "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830"
  // Ref Txn hash : https://sepolia.etherscan.io/tx/0xe0a2750c460a11630a5385e4726b5bdf56ca3574203a594659286efa37beed02

  const VaultToken = await ethers.getContractFactory('VaultToken')
  const vaultToken = await VaultToken.deploy(aaveToken)
  await vaultToken.deployed()
  console.log('VaultToken deployed:', vaultToken.address)

  const atoken = await ethers.getContractAt(
    "TokenX",
    "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830"
  );

  const StrategyAave = await ethers.getContractFactory('StrategyAave')
  const strategyAave = await StrategyAave.deploy(WETHGateway,vaultToken.address, aaveToken)
  await strategyAave.deployed()
  console.log('StrategyAave deployed:', strategyAave.address)

  // // deploy DiamondCutFacet
  // const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
  // const diamondCutFacet = await DiamondCutFacet.deploy()
  // await diamondCutFacet.deployed()
  // console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

  // // deploy Diamond
  // const Diamond = await ethers.getContractFactory('Diamond')
  // const diamond = await Diamond.deploy(contractOwner.address, diamondCutFacet.address)
  // await diamond.deployed()
  // console.log('Diamond deployed:', diamond.address)

  // // deploy DiamondInit
  // const DiamondInit = await ethers.getContractFactory('DiamondInit')
  // const diamondInit = await DiamondInit.deploy()
  // await diamondInit.deployed()
  // console.log('DiamondInit deployed:', diamondInit.address)


  // const valueInWei = ethers.utils.parseEther("0.00001"); 
  // const tx1 = await strategyAave.deposit(contractOwner.address,{ value: valueInWei });
  // console.log(tx1)

  // // deploy facets
  // console.log('')
  // console.log('Deploying facets')
  // const FacetNames = [
  //   'DiamondLoupeFacet',
  //   'OwnershipFacet',
  //   'StrategyManager'
  // ]
  // const cut = []
  // for (const FacetName of FacetNames) {
  //   const Facet = await ethers.getContractFactory(FacetName)
  //   const facet = await Facet.deploy()
  //   await facet.deployed()
  //   // await hre.run("verify:verify", {
  //   //   address: facet.address,
  //   //   constructorArguments: [],
  //   // });
  //   console.log(`${FacetName} deployed: ${facet.address}`)
  //   cut.push({
  //     facetAddress: facet.address,
  //     action: FacetCutAction.Add,
  //     functionSelectors: getSelectors(facet)
  //   })
  // }

  // // upgrade diamond with facets
  // console.log('')
  // console.log('Diamond Cut:', cut)
  // const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address);
  // let tx
  // let receipt
  // // call to init function
  // let functionCall = diamondInit.interface.encodeFunctionData('init')
  // tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
  // console.log('Diamond cut tx: ', tx.hash)
  // receipt = await tx.wait()
  // if (!receipt.status) {
  //   throw Error(`Diamond upgrade failed: ${tx.hash}`)
  // }

  // const StrategyAave = await ethers.getContractFactory('StrategyAave')
  // const strategyAave = await StrategyAave.deploy()
  // await strategyAave.deployed()
  // console.log('StrategyAave deployed:', strategyAave.address)

  // const StrategyCompound = await ethers.getContractFactory('StrategyCompound')
  // const strategyCompound = await StrategyCompound.deploy()
  // await strategyCompound.deployed()
  // console.log('StrategyCompound deployed:', strategyCompound.address)

  // console.log('Completed diamond cut')

  // const diamondContract = await ethers.getContractAt(
  //   "StrategyManager",
  //   "0x17db14c105D320126e660417567236759A82b8b9"
  // );

  async function removeAndAddStrategy(strategyName, strategyAddress) {
    try {
      // Remove the strategy
      await diamondContract.removeStrategy(strategyName);
      console.log(`${strategyName} strategy removal initiated`);

      await new Promise((resolve) => setTimeout(resolve, 5000)); // 3 second delay
  
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
  
  async function testFunctions(strategyName, strategyAddress, amount) {
    try {
      await removeAndAddStrategy(strategyName, strategyAddress);
      console.log("Strategy removed and added successfully");
      await diamondContract.deposit(
        strategyName,
        amount
      );
      console.log("Deposit transaction sent");
    } catch (error) {
      console.error("Error:", error);
    }
  }

  // await testFunctions("Aave", strategyAave.address, 10000000);
  // await testFunctions("Compound", "0x2dCD1CD26Be25A3F2fD4a2E4c9D8b67F9bb1c91B", 10000000);

  return diamond.address


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}
exports.deployDiamond = deployDiamond

// The contract 0x7970bcfDBad3244c2355F936750AaFCAeD3FF9E8 has already been verified
// DiamondCutFacet deployed: 0x7970bcfDBad3244c2355F936750AaFCAeD3FF9E8
// The contract 0x17db14c105D320126e660417567236759A82b8b9 has already been verified
// Diamond deployed: 0x17db14c105D320126e660417567236759A82b8b9
// The contract 0x8Ef76411A1bd8f8130544be57FBE6242428a2249 has already been verified
// DiamondInit deployed: 0x8Ef76411A1bd8f8130544be57FBE6242428a2249

// Deploying facets
// DiamondLoupeFacet deployed: 0x63d40F285f13996268bfC869005593d874bd38Cb
// duplicate definition - OwnershipTransferred(address,address)
// OwnershipFacet deployed: 0x09dea301F4ce7Df069f3C7d79Ac4568cFfFc06B4
// StrategyManager deployed: 0x7ee20a623C3E975f371fFCa53708d0517989c64C

// Diamond Cut: [
//   {
//     facetAddress: '0x63d40F285f13996268bfC869005593d874bd38Cb',
//     action: 0,
//     functionSelectors: [
//       '0xcdffacc6',
//       '0x52ef6b2c',
//       '0xadfca15e',
//       '0x7a0ed627',
//       '0x01ffc9a7',
//       contract: [Contract],
//       remove: [Function: remove],
//       get: [Function: get]
//     ]
//   },
//   {
//     facetAddress: '0x09dea301F4ce7Df069f3C7d79Ac4568cFfFc06B4',
//     action: 0,
//     functionSelectors: [
//       '0x8da5cb5b',
//       '0xf2fde38b',
//       contract: [Contract],
//       remove: [Function: remove],
//       get: [Function: get]
//     ]
//   },
//   {
//     facetAddress: '0x7ee20a623C3E975f371fFCa53708d0517989c64C',
//     action: 0,
//     functionSelectors: [
//       '0xcdd5d9dd',
//       '0xfe42a085',
//       '0x8e27d719',
//       '0x8381f3e6',
//       '0xe96eb99f',
//       '0x780f1acd',
//       '0x30b39a62',
//       contract: [Contract],
//       remove: [Function: remove],
//       get: [Function: get]
//     ]
//   }
// ]
// Diamond cut tx:  0xef0c712feb34252f0ebcca590271d959a6c605a831fa6e06a1f741749635c352
// StrategyAave deployed: 0xAE57c69ED00c7549342306a2df427F4F1B2C4225
// StrategyCompound deployed: 0x2dCD1CD26Be25A3F2fD4a2E4c9D8b67F9bb1c91B
// Completed diamond cut
// StrategyAave deployed: 0x2F321f29BC27292c09682Cc31a4CfE29EAD7fA17
