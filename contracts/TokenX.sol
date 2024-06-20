// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenX is ERC20, Ownable, AccessControl {
    // bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {
        // grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _mint(msg.sender, 10000 * 10 ** decimals());
    }

    //Remove this
    function allow(address to, bool amount) public {
        bool a = true;
    }

    // function setMinterRole(address minter) external onlyOwner {
    //     grantRole(MINTER_ROLE, minter);
    // }

    // function revokeMinterRole(address minter) external onlyOwner {
    //     revokeRole(MINTER_ROLE, minter);
    // }
}
