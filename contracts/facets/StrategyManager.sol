// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IDiamondCut} from "../interfaces/IDiamondCut.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract StrategyManager {
    // Mapping to store the addresses of strategy contracts
    mapping(string => address) public strategies;

    // Event emitted when a strategy is added
    event StrategyAdded(string indexed strategyName, address indexed strategy);
    event StrategyRemoved(string indexed strategyName);

    event Deposited(string indexed strategyName);
    event Withdraw(string indexed strategyName);
    event Balance(string indexed strategyName);

    // Modifier to restrict access to only the owner (diamond contract)
    modifier onlyOwner() {
        require(
            msg.sender == LibDiamond.contractOwner(),
            "StrategyManager: caller is not the owner"
        );
        _;
    }

    // Function to add a new strategy contract
    function addStrategy(
        string memory _strategyName,
        address _strategyAddress
    ) external onlyOwner {
        require(
            _strategyAddress != address(0),
            "StrategyManager: Invalid strategy address"
        );
        require(
            strategies[_strategyName] == address(0),
            "StrategyManager: Strategy already exists"
        );
        strategies[_strategyName] = _strategyAddress;
        emit StrategyAdded(_strategyName, _strategyAddress);
    }

    function removeStrategy(
        string memory _strategyName
    ) external onlyOwner {
        strategies[_strategyName] = address(0);
        emit StrategyRemoved(_strategyName);
    }

    function isStrategy(
        string memory _strategyName
    ) external view returns(bool) {
        if (strategies[_strategyName] == address(0)) {
            return false;
        } else {
            return true;
        }
    }

    // Function to deposit funds into a strategy
    function deposit(string memory _strategyName, uint256 amount) external {
        address strategy = strategies[_strategyName];
        require(
            strategy != address(0),
            "StrategyManager: Strategy does not exist"
        );
        IERC20(IStrategy(strategy).asset()).transferFrom(msg.sender, strategy, amount);
        IStrategy(strategy).deposit(amount, msg.sender);
        emit Deposited(_strategyName);
    }

    // Function to withdraw funds from a strategy
    function withdraw(string memory _strategyName, uint256 _amount) external {
        address strategy = strategies[_strategyName];
        require(
            strategy != address(0),
            "StrategyManager: Strategy does not exist"
        );
        // IERC20(IStrategy(strategy).tokenX()).transferFrom(msg.sender, strategy, _amount);
        IStrategy(strategy).withdraw(msg.sender, _amount);
        emit Withdraw(_strategyName);
    }

    // Function to check the balance of a user in a strategy
    function balance(
        string memory _strategyName,
        address user
    ) external view returns (uint256 _balance) {
        address strategy = strategies[_strategyName];
        require(
            strategy != address(0),
            "StrategyManager: Strategy does not exist"
        );
        // Forward the call to the strategy contract
        _balance = IStrategy(strategy).balance(user);
    }
}
