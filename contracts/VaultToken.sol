// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

contract VaultToken is ERC4626 {
    constructor(IERC20 _asset) ERC4626(_asset) ERC20("Vault Token", "vTX") {}
}
