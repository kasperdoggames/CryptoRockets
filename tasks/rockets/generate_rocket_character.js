const fs = require("fs");
const NFTStorage = require("nft.storage").NFTStorage;
const Blob = require("nft.storage").Blob;

require("dotenv").config;

task("generate-rocket-character", "Generate a rocket character")
  .addParam("contract", "The address of the contract that you want to call")
  .addParam(
    "imagepath",
    "The filepath to the image file to store in filecoin/ipfs"
  )
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const networkId = network.name;
    console.log(
      `Generating a rocket character on contract ${contractAddr} on network ${networkId}`
    );

    //Upload image to NFT.storage
    const client = new NFTStorage({ token: process.env.NFTSTORAGE_API_KEY });
    const imageData = await fs.promises.readFile(taskArgs.imagepath);

    const cid = await client.storeBlob(new Blob([imageData]));
    const ipfsUri = `ipfs://${cid}`;
    console.log(`Rocket character image uploaded with cid: ${cid}`);

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");

    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    //Create character
    const rocketCharacterContract = new ethers.Contract(
      contractAddr,
      RocketCharacter.interface,
      signer
    );

    const transactionResponse = await rocketCharacterContract.mintToken(
      ipfsUri
    );

    const transactionReceipt = await transactionResponse.wait();
    console.log(
      `Success, rocket character minted. Transaction Hash: ${transactionResponse.hash}`
    );
  });

module.exports = {};
