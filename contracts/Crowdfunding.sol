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

    // Функция для создания новой краудфандинговой кампании
function createCampaign(
    string memory _title,
    uint256 _goal,
    uint256 _durationInDays
) public {
    // создаём новый контракт кампании
    Campaign memory newCampaign;
    newCampaign.title = _title;
    newCampaign.creator = payable(msg.sender);
    newCampaign.goal = _goal;
    newCampaign.collectedAmount = 0;
    newCampaign.deadline = block.timestamp + (_durationInDays * 1 days);
    newCampaign.finalized = false;

    // добавляем кампанию в массив
    campaigns.push(newCampaign);
}

// Функция для внесения средств в кампанию
function contribute(uint256 _campaignId) public payable {
    Campaign storage campaign = campaigns[_campaignId];

    // проверка: кампания ещё не завершена
    require(block.timestamp <= campaign.deadline, "Campaign has ended");

    // проверка: пользователь отправил больше 0 ETH
    require(msg.value > 0, "You need to send some ETH");

    // обновляем вклад пользователя
    contributions[_campaignId][msg.sender] += msg.value;

    // обновляем общую собранную сумму
    campaign.collectedAmount += msg.value;
}

// Функция для завершения кампании
function finalizeCampaign(uint256 _campaignId) public {
    Campaign storage campaign = campaigns[_campaignId];

    // проверка: кампания ещё не завершена
    require(!campaign.finalized, "Campaign already finalized");

    // проверка: кампания закончилась
    require(block.timestamp > campaign.deadline, "Campaign is still active");

    // если цель достигнута, отправляем средства создателю
    if (campaign.collectedAmount >= campaign.goal) {
        campaign.creator.transfer(campaign.collectedAmount);
    }

    // отмечаем кампанию как завершённую
    campaign.finalized = true;
}


}
