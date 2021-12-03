const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Rocket Character", () => {
  it("Should add a Rocket as a game asset", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);

    await rocketCharacter.deployed();

    const mintRocketTransaction = await rocketCharacter.mintToken(
      "ipfs://1234567890"
    );

    // wait until the transaction is mined
    let receipt = await mintRocketTransaction.wait();
    const tokenId = Number(receipt.events[0].args[2]);

    const tokenUri = await rocketCharacter.tokenURI(tokenId);

    expect(tokenUri).to.equal(
      "data:application/json;base64,eyJuYW1lIjogIlJvY2tldENoYXJhY3RlciAxIiwiZGVzY3JpcHRpb24iOiAiQW4gTkZUIFJvY2tldCBsZXRzIHBlb3BsZSBwbGF5IGluIHRoZSBnYW1lIE1ldGF2ZXJzZS4iLCAiaW1hZ2UiOiAiaXBmczovLzEyMzQ1Njc4OTAiLCAiYXR0cmlidXRlcyI6IFt7ICJkaXNwbGF5X3R5cGUiOiAibnVtYmVyIiwgInRyYWl0X3R5cGUiOiAiU3BlZWQiLCAidmFsdWUiOiAyNzAwfSx7ICJkaXNwbGF5X3R5cGUiOiAibnVtYmVyIiwgInRyYWl0X3R5cGUiOiAiRnVlbCIsICJ2YWx1ZSI6IDMwfSx7ICJkaXNwbGF5X3R5cGUiOiAiYm9vc3RfcGVyY2VudGFnZSIsICJ0cmFpdF90eXBlIjogIkVhcm5pbmdzIiwgInZhbHVlIjogMH0seyAiZGlzcGxheV90eXBlIjogIm51bWJlciIsICJ0cmFpdF90eXBlIjogIk9mZmxpbmUiLCAidmFsdWUiOiAxfV19"
    );
  });

  it("Only allow minting of three rockets per owner", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);

    await rocketCharacter.deployed();

    let mintRocketTransaction = await rocketCharacter.mintToken(
      "ipfs://1234567890"
    );

    let receipt = await mintRocketTransaction.wait();

    mintRocketTransaction = await rocketCharacter.mintToken(
      "ipfs://1234567890"
    );

    receipt = await mintRocketTransaction.wait();

    mintRocketTransaction = await rocketCharacter.mintToken(
      "ipfs://1234567890"
    );

    receipt = await mintRocketTransaction.wait();

    expect(await rocketCharacter.getRocketsOwned().length, 3);

    await expect(
      rocketCharacter.mintToken("ipfs://1234567890")
    ).to.be.revertedWith("Maximum allowed rockets owned already reached.");
  });

  it("Initial balance should be zero", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);
    await rocketCharacter.deployed();

    const balance = await rocketCharacter.getBalance();
    expect(balance).to.equal(0);
  });

  it("Should create rocket NFT", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);
    await rocketCharacter.deployed();

    const mintRocketTransaction = await rocketCharacter.mintToken(
      "ipfs://1234567890"
    );

    // wait until the transaction is mined
    let receipt = await mintRocketTransaction.wait();
    const tokenId = Number(receipt.events[0].args[2]);

    expect(tokenId).to.equal(1);
  });

  it("Should log no upgrade flight plan", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);
    await rocketCharacter.deployed();

    const mintRocketTransaction = await rocketCharacter.mintToken(
      "ipfs://1234567890"
    );

    // wait until the transaction is mined
    let receipt = await mintRocketTransaction.wait();
    const tokenId = Number(receipt.events[0].args[2]);

    const logFlightPlanTransaction = await rocketCharacter.logFlightPlan(
      tokenId,
      0,
      0,
      0,
      0
    );

    receipt = await logFlightPlanTransaction.wait();

    const rocketAttributes = await rocketCharacter.getTokenAttributes(tokenId);

    expect(rocketAttributes.speedIndex).to.equal(1);
    expect(rocketAttributes.fuelIndex).to.equal(1);
    expect(rocketAttributes.earningsIndex).to.equal(1);
    expect(rocketAttributes.offlineIndex).to.equal(1);
  });

  it("Should receive error logging flight plan with insufficent funds", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);
    await rocketCharacter.deployed();

    const mintRocketTransaction = await rocketCharacter.mintToken(
      "ipfs://1234567890"
    );

    // wait until the transaction is mined
    let receipt = await mintRocketTransaction.wait();
    const tokenId = Number(receipt.events[0].args[2]);

    await expect(
      rocketCharacter.logFlightPlan(tokenId, 1, 1, 1, 1)
    ).to.be.revertedWith("Insufficient funds to cover upgrades");
  });

  it("Should log launch", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);
    await rocketCharacter.deployed();

    const mintRocketTransaction = await rocketCharacter.mintToken(
      "ipfs://1234567890"
    );

    let receipt = await mintRocketTransaction.wait();
    const tokenId = Number(receipt.events[0].args[2]);

    const logLaunchTransaction = await rocketCharacter.logFlight(tokenId, 100);
    receipt = await logLaunchTransaction.wait();

    const balance = await rocketCharacter.getBalance();

    expect(balance).to.equal(1000);
  });

  it("Should log launch then upgrade flight plan", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();

    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);
    await rocketCharacter.deployed();

    const mintRocketTransaction = await rocketCharacter.mintToken(
      "ipfs://1234567890"
    );

    let receipt = await mintRocketTransaction.wait();
    const tokenId = Number(receipt.events[0].args[2]);

    const logLaunchTransaction = await rocketCharacter.logFlight(tokenId, 100);
    receipt = await logLaunchTransaction.wait();

    let balance = await rocketCharacter.getBalance();

    expect(balance).to.equal(1000);

    const logFlightPlanTransaction = await rocketCharacter.logFlightPlan(
      tokenId,
      1,
      1,
      1,
      1
    );
    await logFlightPlanTransaction.wait();

    balance = await rocketCharacter.getBalance();

    expect(balance).to.equal(1000 - 360);
  });

  it("should return initial amounts", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();
    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);
    await rocketCharacter.deployed();

    expect(await rocketCharacter.initialCost()).to.equal(10);
    expect(await rocketCharacter.initialSpeed()).to.equal(2700);
    expect(await rocketCharacter.initialFuel()).to.equal(30);
    expect(await rocketCharacter.initialEarnings()).to.equal(0);
    expect(await rocketCharacter.initialOffline()).to.equal(1);
  });

  it("should return upgrade increments", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();
    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);
    await rocketCharacter.deployed();

    expect(await rocketCharacter.speedUpgradeIncrement()).to.equal(340);
    expect(await rocketCharacter.fuelUpgradeIncrement()).to.equal(7);
    expect(await rocketCharacter.earningsUpgradeIncrement()).to.equal(2);
    expect(await rocketCharacter.offlineUpgradeIncrement()).to.equal(2);
    expect(await rocketCharacter.upgradeCostIncrement()).to.equal(60);
  });

  it("should return costs", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();
    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);
    await rocketCharacter.deployed();

    expect(await rocketCharacter.newAmount(1, 0, 340, 2700)).to.equal(2700);
    expect(await rocketCharacter.newAmount(1, 1, 340, 2700)).to.equal(3040);
    expect(await rocketCharacter.newAmount(2, 1, 340, 2700)).to.equal(3380);
  });

  it("should return amounts", async () => {
    const Market = await ethers.getContractFactory("Market");
    const market = await Market.deploy();
    await market.deployed();
    const RocketCharacter = await ethers.getContractFactory("RocketCharacter");
    const rocketCharacter = await RocketCharacter.deploy(market.address);
    await rocketCharacter.deployed();

    expect(await rocketCharacter.newCost(1, 0)).to.equal(10);
    expect(await rocketCharacter.newCost(1, 1)).to.equal(100);
    expect(await rocketCharacter.newCost(1, 2)).to.equal(250);
    expect(await rocketCharacter.newCost(2, 1)).to.equal(250);
  });
});

describe("Rocket Part", () => {
  it("Should add rocket parts as game assets", async () => {
    const RocketPart = await ethers.getContractFactory("RocketPart");
    const rocketPart = await RocketPart.deploy();

    await rocketPart.deployed();

    let transaction = await rocketPart.mintToken(0, "ipfs://1234567890");
    await transaction.wait();

    transaction = await rocketPart.mintToken(1, "ipfs://1234567890");
    await transaction.wait();

    transaction = await rocketPart.mintToken(2, "ipfs://1234567890");
    await transaction.wait();

    const tokenURIs = await rocketPart.getAllRocketParts();

    expect(tokenURIs.length).to.equal(3);
  });
});
