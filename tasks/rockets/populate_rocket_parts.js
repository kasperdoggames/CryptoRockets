const fs = require("fs");
const path = require("path");
const NFTStorage = require("nft.storage").NFTStorage;
const Blob = require("nft.storage").Blob;

require("dotenv").config;

task("populate-rocket-parts", "Populate rocket parts")
  .addParam("contract", "The address of the contract that you want to call")
  .addParam(
    "dirpath",
    "The directory path to the images to store in filecoin/ipfs"
  )
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const networkId = network.name;
    console.log(
      `Populating rocket parts in contract ${contractAddr} on network ${networkId}`
    );

    const partTypes = ["nose", "fuselage", "tail"];

    const storeBlob = async (
      rocketPartContract,
      client,
      filePath,
      partTypeIndex
    ) => {
      return new Promise((resolve) => {
        const delay = Math.floor(Math.random() * 10000) + partTypeIndex * 12000;
        setTimeout(async () => {
          const imageData = await fs.promises.readFile(filePath);
          const cid = await client.storeBlob(new Blob([imageData]));
          const ipfsUri = `ipfs://${cid}`;

          const transactionResponse = await rocketPartContract.mintToken(
            partTypeIndex,
            ipfsUri
          );
          const receipt = await transactionResponse.wait();
          const tokenId = receipt.events[0].args[2];
          console.log(
            `Success, rocket part created #${tokenId}, cid:${cid}, ${filePath}`
          );
          resolve();
        }, delay);
      });
    };

    for (
      let partTypeIndex = 0;
      partTypeIndex < partTypes.length;
      partTypeIndex++
    ) {
      const partType = partTypes[partTypeIndex];
      const dirPath = path.join(__dirname, `${taskArgs.dirpath}/${partType}`);
      let filenames = fs.readdirSync(dirPath);
      const client = new NFTStorage({ token: process.env.NFTSTORAGE_API_KEY });
      const RocketPart = await ethers.getContractFactory("RocketPart");
      const accounts = await hre.ethers.getSigners();
      const signer = accounts[0];
      const rocketPartContract = new ethers.Contract(
        contractAddr,
        RocketPart.interface,
        signer
      );
      await Promise.all(
        filenames
          .filter((filename) => filename.startsWith(partType))
          .map(async (filename) => {
            const filePath = path.join(
              __dirname,
              `${taskArgs.dirpath}/${partType}/${filename}`
            );

            await storeBlob(
              rocketPartContract,
              client,
              filePath,
              partTypeIndex
            );
          })
      );
    }
  });

module.exports = {};
