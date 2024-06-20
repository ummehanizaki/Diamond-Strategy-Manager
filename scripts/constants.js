// constants.js

const FacetNames = ["DiamondLoupeFacet", "OwnershipFacet"];
const amount = 10000000000000;

const strategyNameAave = "Aave";
const AaveWETH = "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c";
const AavePoolWETH = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
const aWETH = "0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830";

const strategyNameCompound = "Compound";
const CompoundWETH = "0x2D5ee574e710219a521449679A4A7f2B43f046ad";
const CompoundPoolWETH = "0x2943ac1216979aD8dB76D9147F64E61adc126e96";
const cWETH = "0x2943ac1216979aD8dB76D9147F64E61adc126e96";

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
