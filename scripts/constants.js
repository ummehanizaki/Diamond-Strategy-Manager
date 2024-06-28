// constants.js

const FacetNames = ["DiamondLoupeFacet", "OwnershipFacet"];
const amount = 100000000000000;

const strategyNameAave = "Aave";
const AaveWETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const AavePoolWETH = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
const aWETH = "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8";

const strategyNameCompound = "Compound";
const CompoundWETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const CompoundPoolWETH = "0xA17581A9E3356d9A858b789D68B4d866e593aE94";
const cWETH = "0xA17581A9E3356d9A858b789D68B4d866e593aE94";

module.exports = {
  FacetNames,
  strategyNameAave,
  strategyNameCompound,
  cWETH,
  CompoundPoolWETH,
  CompoundWETH,
  amount,
  AavePoolWETH,
  aWETH,
  AaveWETH,
};
