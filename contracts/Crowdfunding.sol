// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Crowdfunding {
    struct Campaign {
        string title;
        address payable creator;
        uint256 goal;
        uint256 collectedAmount;
        uint256 deadline;
        bool finalized;
    }

    Campaign[] public campaigns;

    mapping(uint256 => mapping(address => uint256)) public contributions;
}
