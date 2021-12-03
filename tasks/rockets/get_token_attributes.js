const fs = require("fs");
const File = require("nft.storage").File;
const NFTStorage = require("nft.storage").NFTStorage;
const Blob = require("nft.storage").Blob;

require("dotenv").config;

task("get-token-attributes", "Retrieve the tokenURI for a specific rocket")
  .addParam("contract", "The address of the contract that you want to call")
  .addParam("name", "The name of the contract that you want to call")
  .addParam("tokenid", "The tokenId for the rocket")
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const networkId = network.name;

    const TokenContract = await ethers.getContractFactory(taskArgs.name);

    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    //Create character
    const tokenContract = new ethers.Contract(
      contractAddr,
      TokenContract.interface,
      signer
    );

    const transactionResponse = await tokenContract.tokenURI(
      Number(taskArgs.tokenid)
    );

    console.log(transactionResponse);
  });

module.exports = {};
