// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RewardToken.sol";

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

    RewardToken public rewardToken;
    address public owner;

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goal, uint256 deadline);
    event Contributed(uint256 indexed campaignId, address indexed contributor, uint256 amountWei, uint256 rewardMinted);
    event CampaignFinalized(uint256 indexed campaignId, bool goalReached, uint256 totalCollected);
    event RewardTokenSet(address indexed token);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setRewardToken(address _tokenAddress) external onlyOwner {
        require(_tokenAddress != address(0), "Zero address");
        require(address(rewardToken) == address(0), "Token already set");
        rewardToken = RewardToken(_tokenAddress);
        emit RewardTokenSet(_tokenAddress);
    }

    function createCampaign(
        string memory _title,
        uint256 _goal,
        uint256 _durationInDays
    ) external {
        require(_goal > 0, "Goal must be > 0");
        require(_durationInDays > 0, "Duration must be > 0");
        require(bytes(_title).length > 0, "Title required");

        uint256 deadline = block.timestamp + (_durationInDays * 1 days);

        campaigns.push(
            Campaign({
                title: _title,
                creator: payable(msg.sender),
                goal: _goal,
                collectedAmount: 0,
                deadline: deadline,
                finalized: false
            })
        );

        emit CampaignCreated(campaigns.length - 1, msg.sender, _title, _goal, deadline);
    }

    function contribute(uint256 _campaignId) external payable {
        require(_campaignId < campaigns.length, "Invalid campaignId");

        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp <= campaign.deadline, "Campaign ended");
        require(!campaign.finalized, "Campaign finalized");
        require(msg.value > 0, "Send some ETH");

        contributions[_campaignId][msg.sender] += msg.value;
        campaign.collectedAmount += msg.value;

        uint256 rewardAmount = 0;

        if (address(rewardToken) != address(0)) {
            rewardAmount = msg.value * 100;
            rewardToken.mint(msg.sender, rewardAmount);
        }

        emit Contributed(_campaignId, msg.sender, msg.value, rewardAmount);
    }

   function finalizeCampaign(uint256 _campaignId) external {
    Campaign storage c = campaigns[_campaignId];

    require(!c.finalized, "Already finalized");
    require(c.collectedAmount >= c.goal, "Goal not reached");

    require(msg.sender == c.creator, "Only creator");

    c.finalized = true;

    (bool ok, ) = c.creator.call{value: c.collectedAmount}("");
    require(ok, "Transfer failed");

    emit CampaignFinalized(_campaignId, true, c.collectedAmount);
}

}