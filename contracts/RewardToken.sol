// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RewardToken is ERC20 {
    address public owner;

    constructor() ERC20("CrowdReward", "CRT") {
        owner = msg.sender;
    }

    // функция mint доступна только владельцу (наш Crowdfunding контракт будет владельцем)
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner, "Only owner can mint tokens");
        _mint(to, amount);
    }
}
