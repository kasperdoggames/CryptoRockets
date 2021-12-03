const fs = require("fs");
const path = require("path");
const NFTStorage = require("nft.storage").NFTStorage;
const Blob = require("nft.storage").Blob;

require("dotenv").config;

task("populate-soundeffects", "Populate soundeffects")
  .addParam("contract", "The address of the contract that you want to call")
  .addParam(
    "dirpath",
    "The directory path to the audio to store in filecoin/ipfs"
  )
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const networkId = network.name;
    console.log(
      `Populating soundeffects in contract ${contractAddr} on network ${networkId}`
    );

    const audioTypes = ["background", "explosion", "thrust", "ping"];

    for (
      let audioTypeIndex = 0;
      audioTypeIndex < audioTypes.length;
      audioTypeIndex++
    ) {
      const audioType = audioTypes[audioTypeIndex];
      const dirPath = path.join(__dirname, `${taskArgs.dirpath}/${audioType}`);
      let filenames = fs.readdirSync(dirPath);
      const client = new NFTStorage({ token: process.env.NFTSTORAGE_API_KEY });
      const SoundEffect = await ethers.getContractFactory("SoundEffect");
      const accounts = await hre.ethers.getSigners();
      const signer = accounts[0];
      const soundEffectContract = new ethers.Contract(
        contractAddr,
        SoundEffect.interface,
        signer
      );
      await Promise.all(
        filenames
          .filter((filename) => filename.startsWith(audioType))
          .map(async (filename) => {
            const filePath = path.join(
              __dirname,
              `${taskArgs.dirpath}/${audioType}/${filename}`
            );
            console.log(filePath);
            const audioData = await fs.promises.readFile(filePath);
            const cid = await client.storeBlob(new Blob([audioData]), {
              type: "audio/mp3",
            });
            const ipfsUri = `ipfs://${cid}`;
            console.log(`Soundeffect uploaded with cid: ${cid}`);

            const transactionResponse = await soundEffectContract.mintToken(
              audioTypeIndex,
              ipfsUri
            );
            const receipt = await transactionResponse.wait();
            const tokenId = receipt.events[0].args[2];
            console.log(
              `Success, soundeffect #${tokenId}, type ${audioTypeIndex} minted. Transaction Hash: ${transactionResponse.hash}`
            );
          })
      );
    }
  });

module.exports = {};
