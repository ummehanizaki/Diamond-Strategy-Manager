/* global describe it before ethers */

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js');

const { deployDiamond } = require('../scripts/deploy.js');
const { expect } = require("chai");

const { assert } = require('chai');

describe('DiamondTest', async function () {
  console.log("test1")
  const { chainId } = await ethers.provider.getNetwork();
  
  console.log(chainId)

  console.log("F")

  const WETHGateway = "0x387d311e47e80b498169e6fb51d3193167d89F7D";
  const aaveToken = "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830";
  const accounts = await ethers.getSigners();
  contractOwner = accounts[0];
  const addresses = [];
  let diamondContract;
  let atoken;

  // before(async function () {

  //   const a = 0;
  //   // atoken = await ethers.getContractAt(
  //   //   "TokenX",
  //   //   aaveToken
  //   // );
  // });

  console.log(chainId);
  if (chainId == 12345) {
    console.log("correct network")
  }
  
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner] = await ethers.getSigners();
    console.log(network.config.forking.enabled);
    console.log("test")
    // const hardhatToken = await ethers.deployContract("TokenX");
    const TokenX = await ethers.getContractFactory('TokenX')
    // await hardhatToken.waitForDeployment();

    // // mintableERC20 = await MintableERC20.deploy("TokenName", "TokenSymbol");
    hardhatToken = await TokenX.deploy("TokenName", "TokenSymbol");

    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });

})
  // // Test case to check aaveToken balance for contractOwner
  // it('should have balance of aave', async () => {
  //   const balance = await atoken.balanceOf(contractOwner.address);
  //   // Assert the balance using chai
    
  //   assert.isAbove(balance, 0, "Contract owner should have some aaveToken balance");
  // });



  // // before(async function () {
  // diamondAddress = await deployDiamond()

  // const WETHGateway = "0x387d311e47e80b498169e6fb51d3193167d89F7D"
  // const aaveToken = "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830"
  // // Ref Txn hash : https://sepolia.etherscan.io/tx/0xe0a2750c460a11630a5385e4726b5bdf56ca3574203a594659286efa37beed02

  // const VaultToken = await ethers.getContractFactory('VaultToken')
  // const vaultToken = await VaultToken.deploy(aaveToken)
  // await vaultToken.deployed()
  // console.log('VaultToken deployed:', vaultToken.address)

  // const atoken = await ethers.getContractAt(
  //   "TokenX",
  //   "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830"
  // );

  // const StrategyAave = await ethers.getContractFactory('StrategyAave')
  // const strategyAave = await StrategyAave.deploy(WETHGateway,vaultToken.address, aaveToken)
  // await strategyAave.deployed()
  // console.log('StrategyAave deployed:', strategyAave.address)

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

  //   diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
  //   diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
  //   ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
  // })

  // it('should have three facets -- call to facetAddresses function', async () => {
  //   for (const address of await diamondLoupeFacet.facetAddresses()) {
  //     addresses.push(address)
  //   }
  //   assert.equal(addresses.length, 3)
  // })

  // it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
  //   let selectors = getSelectors(diamondCutFacet)
  //   result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0])
  //   assert.sameMembers(result, selectors)
  //   selectors = getSelectors(diamondLoupeFacet)
  //   result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1])
  //   assert.sameMembers(result, selectors)
  //   selectors = getSelectors(ownershipFacet)
  //   result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2])
  //   assert.sameMembers(result, selectors)
  // })

  // it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
  //   assert.equal(
  //     addresses[0],
  //     await diamondLoupeFacet.facetAddress('0x1f931c1c')
  //   )
  //   assert.equal(
  //     addresses[1],
  //     await diamondLoupeFacet.facetAddress('0xcdffacc6')
  //   )
  //   assert.equal(
  //     addresses[1],
  //     await diamondLoupeFacet.facetAddress('0x01ffc9a7')
  //   )
  //   assert.equal(
  //     addresses[2],
  //     await diamondLoupeFacet.facetAddress('0xf2fde38b')
  //   )
  // })

  // it('should add test1 functions', async () => {
  //   const StrategyManager = await ethers.getContractFactory('StrategyManager')
  //   const strategyManager = await StrategyManager.deploy()
  //   await strategyManager.deployed()
  //   addresses.push(strategyManager.address)
  //   const selectors = getSelectors(strategyManager).remove(['supportsInterface(bytes4)'])
  //   tx = await diamondCutFacet.diamondCut(
  //     [{
  //       facetAddress: strategyManager.address,
  //       action: FacetCutAction.Add,
  //       functionSelectors: selectors
  //     }],
  //     ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
  //   receipt = await tx.wait()
  //   if (!receipt.status) {
  //     throw Error(`Diamond upgrade failed: ${tx.hash}`)
  //   }
  //   result = await diamondLoupeFacet.facetFunctionSelectors(strategyManager.address)
  //   assert.sameMembers(result, selectors)
  // })

  // it('should test function call', async () => {
  //   const strategyManager = await ethers.getContractAt('StrategyManager', diamondAddress)
  //   await strategyManager.test1Func10()
  // })

  // it('should replace supportsInterface function', async () => {
  //   const StrategyManager = await ethers.getContractFactory('StrategyManager')
  //   const selectors = getSelectors(StrategyManager).get(['supportsInterface(bytes4)'])
  //   const testFacetAddress = addresses[3]
  //   tx = await diamondCutFacet.diamondCut(
  //     [{
  //       facetAddress: testFacetAddress,
  //       action: FacetCutAction.Replace,
  //       functionSelectors: selectors
  //     }],
  //     ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
  //   receipt = await tx.wait()
  //   if (!receipt.status) {
  //     throw Error(`Diamond upgrade failed: ${tx.hash}`)
  //   }
  //   result = await diamondLoupeFacet.facetFunctionSelectors(testFacetAddress)
  //   assert.sameMembers(result, getSelectors(StrategyManager))
  // })

  // it('should remove some test1 functions', async () => {
  //   const strategyManager = await ethers.getContractAt('StrategyManager', diamondAddress)
  //   const functionsToKeep = ['test1Func2()', 'test1Func11()', 'test1Func12()']
  //   const selectors = getSelectors(strategyManager).remove(functionsToKeep)
  //   tx = await diamondCutFacet.diamondCut(
  //     [{
  //       facetAddress: ethers.constants.AddressZero,
  //       action: FacetCutAction.Remove,
  //       functionSelectors: selectors
  //     }],
  //     ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
  //   receipt = await tx.wait()
  //   if (!receipt.status) {
  //     throw Error(`Diamond upgrade failed: ${tx.hash}`)
  //   }
  //   result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3])
  //   assert.sameMembers(result, getSelectors(strategyManager).get(functionsToKeep))
  // })

  // it('remove all functions and facets except \'diamondCut\' and \'facets\'', async () => {
  //   let selectors = []
  //   let facets = await diamondLoupeFacet.facets()
  //   for (let i = 0; i < facets.length; i++) {
  //     selectors.push(...facets[i].functionSelectors)
  //   }
  //   selectors = removeSelectors(selectors, ['facets()', 'diamondCut(tuple(address,uint8,bytes4[])[],address,bytes)'])
  //   tx = await diamondCutFacet.diamondCut(
  //     [{
  //       facetAddress: ethers.constants.AddressZero,
  //       action: FacetCutAction.Remove,
  //       functionSelectors: selectors
  //     }],
  //     ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
  //   receipt = await tx.wait()
  //   if (!receipt.status) {
  //     throw Error(`Diamond upgrade failed: ${tx.hash}`)
  //   }
  //   facets = await diamondLoupeFacet.facets()
  //   assert.equal(facets.length, 2)
  //   assert.equal(facets[0][0], addresses[0])
  //   assert.sameMembers(facets[0][1], ['0x1f931c1c'])
  //   assert.equal(facets[1][0], addresses[1])
  //   assert.sameMembers(facets[1][1], ['0x7a0ed627'])
  // })

  // it('add most functions and facets', async () => {
  //   const diamondLoupeFacetSelectors = getSelectors(diamondLoupeFacet).remove(['supportsInterface(bytes4)'])
  //   const StrategyManager = await ethers.getContractFactory('StrategyManager')
  //   // Any number of functions from any number of facets can be added/replaced/removed in a
  //   // single transaction
  //   const cut = [
  //     {
  //       facetAddress: addresses[1],
  //       action: FacetCutAction.Add,
  //       functionSelectors: diamondLoupeFacetSelectors.remove(['facets()'])
  //     },
  //     {
  //       facetAddress: addresses[2],
  //       action: FacetCutAction.Add,
  //       functionSelectors: getSelectors(ownershipFacet)
  //     },
  //     {
  //       facetAddress: addresses[3],
  //       action: FacetCutAction.Add,
  //       functionSelectors: getSelectors(StrategyManager)
  //     }
  //   ]
  //   tx = await diamondCutFacet.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
  //   receipt = await tx.wait()
  //   if (!receipt.status) {
  //     throw Error(`Diamond upgrade failed: ${tx.hash}`)
  //   }
  //   const facets = await diamondLoupeFacet.facets()
  //   const facetAddresses = await diamondLoupeFacet.facetAddresses()
  //   assert.equal(facetAddresses.length, 4)
  //   assert.equal(facets.length, 4)
  //   assert.sameMembers(facetAddresses, addresses)
  //   assert.equal(facets[0][0], facetAddresses[0], 'first facet')
  //   assert.equal(facets[1][0], facetAddresses[1], 'second facet')
  //   assert.equal(facets[2][0], facetAddresses[2], 'third facet')
  //   assert.equal(facets[3][0], facetAddresses[3], 'fourth facet')
  //   assert.sameMembers(facets[findAddressPositionInFacets(addresses[0], facets)][1], getSelectors(diamondCutFacet))
  //   assert.sameMembers(facets[findAddressPositionInFacets(addresses[1], facets)][1], diamondLoupeFacetSelectors)
  //   assert.sameMembers(facets[findAddressPositionInFacets(addresses[2], facets)][1], getSelectors(ownershipFacet))
  //   assert.sameMembers(facets[findAddressPositionInFacets(addresses[3], facets)][1], getSelectors(StrategyManager))
  // })

