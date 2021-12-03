const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Rocket Market", () => {
  it("Should mint a rocket and sell on market", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);

    await rocketCharacter.deployed();

    // setup event capture to check it is emitted later on
    let rocketCharacterMintedEvent = new Promise((resolve, reject) => {
      rocketCharacter.on("RocketCharacterMinted", (sender, tokenId) => {
        resolve({ sender, tokenId });
      });

      setTimeout(() => {
        reject(new Error("timeout"));
      }, 60000);
    });

    const [seller, buyer] = await ethers.getSigners();

    const tx = await rocketCharacter.connect(seller).mintToken("ipfs://12345");
    const receipt = await tx.wait();
    const tokenId = Number(receipt.events[0].args[2]);
    expect(tokenId).to.equal(1);

    let event = await rocketCharacterMintedEvent;
    expect(event.sender).to.equal(seller.address);
    expect(event.tokenId).to.equal(1);

    let sellerRocketsTokenIds = await rocketCharacter
      .connect(seller)
      .getRocketsOwned();

    expect(sellerRocketsTokenIds.length).to.equal(1);

    const salePrice = ethers.utils.parseUnits("1.3", "ether");
    let listingPrice = await market.getListingPrice();
    expect(Number(listingPrice)).to.equal(
      Number(ethers.utils.parseUnits("0.025", "ether"))
    );

    await market.setMarketForSale(rocketCharacter.address, tokenId, salePrice, {
      value: listingPrice.toString(),
    });

    const marketItems = await market.getMarketItems();
    const itemsForSale = await Promise.all(
      marketItems.map(async (i) => {
        const tokenUri = await rocketCharacter.tokenURI(i.tokenId);
        let item = {
          price: i.price.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenUri,
        };
        return item;
      })
    );

    expect(seller.address).to.equal(itemsForSale[0].seller);

    await market
      .connect(buyer)
      .setMarketSold(rocketCharacter.address, tokenId, { value: salePrice });

    const buyerRocketsTokenIds = await rocketCharacter
      .connect(buyer)
      .getRocketsOwned();

    sellerRocketsTokenIds = await rocketCharacter
      .connect(seller)
      .getRocketsOwned();

    expect(sellerRocketsTokenIds.length).to.equal(0);
    expect(buyerRocketsTokenIds.length).to.equal(1);
  });

  it("Should allow market sale to be cancelled", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);

    await rocketCharacter.deployed();

    const [seller, _] = await ethers.getSigners();

    let tx = await rocketCharacter.connect(seller).mintToken("ipfs://12345");
    let receipt = await tx.wait();
    const tokenId = Number(receipt.events[0].args[2]);

    const salePrice = ethers.utils.parseUnits("1.3", "ether");
    let listingPrice = await market.getListingPrice();
    expect(Number(listingPrice)).to.equal(
      Number(ethers.utils.parseUnits("0.025", "ether"))
    );

    tx = await market.setMarketForSale(
      rocketCharacter.address,
      tokenId,
      salePrice,
      {
        value: listingPrice.toString(),
      }
    );
    receipt = await tx.wait();
    const itemId = Number(receipt.events[0].args[2]);

    sellerRocketsTokenIds = await rocketCharacter
      .connect(seller)
      .getRocketsOwned();

    expect(sellerRocketsTokenIds.length).to.equal(0);

    tx = await market
      .connect(seller)
      .cancelSale(rocketCharacter.address, itemId);
    receipt = await tx.wait();

    sellerRocketsTokenIds = await rocketCharacter
      .connect(seller)
      .getRocketsOwned();

    expect(sellerRocketsTokenIds.length).to.equal(1);

    const marketItems = await market.connect(seller).getMarketItems();
    const sellerMarketItems = marketItems.filter((mi) => mi.seller === seller);

    console.log(`sellerMarketItems.length: ${sellerMarketItems.length}`);

    expect(sellerMarketItems.length).to.equal(0);
  });

  it("Cannot buy your own rocket", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);

    await rocketCharacter.deployed();

    const [seller, _] = await ethers.getSigners();

    let tx = await rocketCharacter.connect(seller).mintToken("ipfs://12345");
    let receipt = await tx.wait();
    const tokenId = Number(receipt.events[0].args[2]);

    const salePrice = ethers.utils.parseUnits("1.3", "ether");
    let listingPrice = await market.getListingPrice();
    expect(Number(listingPrice)).to.equal(
      Number(ethers.utils.parseUnits("0.025", "ether"))
    );

    tx = await market.setMarketForSale(
      rocketCharacter.address,
      tokenId,
      salePrice,
      {
        value: listingPrice.toString(),
      }
    );
    receipt = await tx.wait();
    const itemId = Number(receipt.events[0].args[2]);

    sellerRocketsTokenIds = await rocketCharacter
      .connect(seller)
      .getRocketsOwned();

    expect(sellerRocketsTokenIds.length).to.equal(0);

    await expect(
      market.connect(seller).setMarketSold(rocketCharacter.address, itemId)
    ).to.be.revertedWith("Cannot buy your own rocket");
  });
});
