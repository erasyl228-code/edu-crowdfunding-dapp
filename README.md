# Sample Hardhat 3 Beta Project (minimal)


Network: Ethereum Sepolia

RewardToken address:
0x1a6f82cdc1956e61840c075c930150b61f823f6

Crowdfunding address:
0xb068a264225d8ca159ea17d0911323ce78948



Educational Crowdfunding DApp

Blockchain 1 – Final Examination Project

Project Overview

This project is a decentralized educational crowdfunding application built on the Ethereum blockchain using the Sepolia test network.
The main purpose of the project is to demonstrate practical skills in smart contract development, blockchain interaction, and decentralized application (DApp) architecture.

The application allows users to create crowdfunding campaigns, contribute test ETH, receive internal reward tokens, and finalize campaigns in a transparent and decentralized way.

Technology Stack

Solidity – smart contract development

Ethereum (Sepolia Testnet) – blockchain network

Hardhat – compilation and deployment

JavaScript (ethers.js) – frontend blockchain interaction

MetaMask – wallet integration

HTML / CSS – frontend interface

Smart Contracts

The project consists of two smart contracts:

1. Crowdfunding.sol

This contract manages all crowdfunding logic:

Creating campaigns with a title, funding goal, and duration

Accepting ETH contributions from users

Tracking collected funds

Finalizing campaigns

Triggering reward token minting for contributors

Each campaign stores:

Title

Creator address

Goal amount

Collected amount

Deadline

Finalized status

All campaign data is stored on-chain and publicly accessible.

2. RewardToken.sol

This contract is a custom ERC-20 token used only for educational purposes.

Tokens are minted automatically when users contribute

Minting is restricted and can only be called by the Crowdfunding contract

Users cannot mint tokens manually

The token has no real monetary value

This demonstrates core tokenization concepts and access control.

Deployment

The smart contracts were:

Compiled with Solidity 0.8.20

Deployed to the Sepolia test network using Hardhat

Verified on Sepolia Etherscan using Standard JSON Input

Only free test ETH was used.
Deployment on Ethereum mainnet is strictly avoided.

Frontend Application

The frontend is a simple web application that interacts directly with the blockchain.

Main features:

MetaMask wallet connection

Network validation (Sepolia only)

Campaign creation

ETH contribution

Campaign finalization

Display of ETH and reward token balances

All blockchain interactions require user confirmation through MetaMask.

MetaMask Integration

MetaMask is used to:

Request wallet access

Sign and send transactions

Validate the selected blockchain network

Display user address and balances

If the wrong network is selected, the application shows a warning.

How to Run the Project Locally
1. Install dependencies
npm install

2. Compile contracts
npx hardhat compile

3. Deploy contracts to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

4. Run frontend

Open frontend/index.html in a browser with MetaMask installed.

Educational Purpose

This project is created only for educational use as part of the Blockchain 1 course.

No real cryptocurrency is used

No real financial value exists

All logic runs on a test network

Conclusion

This project demonstrates a complete decentralized crowdfunding system including:

Smart contract design

ERC-20 token usage

MetaMask integration

Frontend-to-blockchain interaction

Deployment and verification on a test network

All course requirements for the final examination project are fully satisfied.