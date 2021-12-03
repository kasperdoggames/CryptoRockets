const fs = require("fs");
const NFTStorage = require("nft.storage").NFTStorage;
const Blob = require("nft.storage").Blob;

require("dotenv").config;

task("generate-soundeffect", "Generate a soundeffect")
  .addParam("contract", "The address of the contract that you want to call")
  .addParam("audiopath", "The name of your component")
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const networkId = network.name;

    console.log(
      `Generating a SoundEffect on contract ${contractAddr} on network ${networkId}`
    );

    //Upload image to NFT.storage
    const client = new NFTStorage({ token: process.env.NFTSTORAGE_API_KEY });
    const audioData = await fs.promises.readFile(taskArgs.audiopath);

    const cid = await client.storeBlob(new Blob([audioData]));
    const ipfsUri = `ipfs://${cid}`;
    console.log(`Soundeffect uploaded via nft.storage with cid: ${cid}`);

    const SoundEffect = await ethers.getContractFactory("SoundEffect");

    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    //Create character
    const soundEffectContract = new ethers.Contract(
      contractAddr,
      SoundEffect.interface,
      signer
    );

    const transactionResponse = await soundEffectContract.mintToken(0, ipfsUri);

    const transactionReceipt = await transactionResponse.wait();
    console.log(
      `Contract ${contractAddr} soundeffect generated. Transaction Hash: ${transactionResponse.hash}`
    );
  });

module.exports = {};
