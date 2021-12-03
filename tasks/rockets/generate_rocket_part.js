const fs = require("fs");
const NFTStorage = require("nft.storage").NFTStorage;
const Blob = require("nft.storage").Blob;

require("dotenv").config;

task("generate-rocket-part", "Generate a rocket part")
  .addParam("contract", "The address of the contract that you want to call")
  .addParam(
    "parttype",
    "The part type for the image to store in filecoin/ipfs. 0=Nose, 1=Fuselage, 2=Tail"
  )
  .addParam(
    "imagepath",
    "The filepath to the image file to store in filecoin/ipfs"
  )
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const networkId = network.name;
    console.log(
      `Generating a rocket part on contract ${contractAddr} on network ${networkId}`
    );

    //Upload image to NFT.storage
    const client = new NFTStorage({ token: process.env.NFTSTORAGE_API_KEY });
    const imageData = await fs.promises.readFile(taskArgs.imagepath);

    const cid = await client.storeBlob(new Blob([imageData]));
    const ipfsUri = `ipfs://${cid}`;
    console.log(`Rocket part image uploaded with cid: ${cid}`);

    const RocketPart = await ethers.getContractFactory("RocketPart");

    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    //Create character
    const rocketPartContract = new ethers.Contract(
      contractAddr,
      RocketPart.interface,
      signer
    );

    const transactionResponse = await rocketPartContract.mintToken(
      taskArgs.parttype,
      ipfsUri
    );

    const transactionReceipt = await transactionResponse.wait();
    console.log(
      `Success, rocket part minted. Transaction Hash: ${transactionResponse.hash}`
    );
  });

module.exports = {};
