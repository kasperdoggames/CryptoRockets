// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const Market = await hre.ethers.getContractFactory("Market");
  const market = await Market.deploy();

  console.log(`---------------------`);
  console.log("Market deployed to:", market.address);
  console.log(`---------------------`);

  const RocketCharacter = await hre.ethers.getContractFactory(
    "RocketCharacter"
  );
  const rocketCharacter = await RocketCharacter.deploy(market.address);
  await rocketCharacter.deployed();

  console.log(`---------------------`);
  console.log("Rocket character deployed to:", rocketCharacter.address);
  console.log(`You can now mint a RocketCharacter...`);
  console.log(
    `npx hardhat generate-rocket-character --contract ${rocketCharacter.address} --imagepath ./assets/rocketparts/rocket1.jpg --network ${network.name}`
  );
  console.log(
    `npx hardhat get_rocket_attributes --contract ${rocketCharacter.address} --tokenid 1 --network ${network.name}`
  );
  console.log(`---------------------`);

  const RocketPart = await hre.ethers.getContractFactory("RocketPart");
  const rocketPart = await RocketPart.deploy();
  await rocketPart.deployed();

  console.log(`---------------------`);
  console.log("RocketPart deployed to:", rocketPart.address);
  console.log(`You can now mint a Rocket Part...`);
  console.log(
    `npx hardhat generate-rocket-part --contract ${rocketPart.address} --parttype 0 --imagepath ./assets/rocketparts/nose1.jpg --network ${network.name}`
  );
  console.log(`... or populate with predefined assets ...`);
  console.log(
    `npx hardhat populate-rocket-parts --contract ${rocketPart.address} --dirpath ../../assets/rocketparts/ --network ${network.name}`
  );
  console.log(`---------------------`);

  const SoundEffect = await hre.ethers.getContractFactory("SoundEffect");
  const soundEffect = await SoundEffect.deploy();
  await soundEffect.deployed();

  console.log(`---------------------`);
  console.log("SoundEffect deployed to:", soundEffect.address);
  console.log(`You can now mint a SoundEffect...`);
  console.log(
    `npx hardhat generate-soundeffect --contract ${soundEffect.address} --audiopath ./assets/sounds/explosion.wav --network ${network.name}`
  );
  console.log(`... or populate with predefined assets ...`);
  console.log(
    `npx hardhat populate-soundeffects --contract ${soundEffect.address} --dirpath ../../assets/soundeffects/ --network ${network.name}`
  );
  console.log(`---------------------`);

  const config = `export const MARKET_CONTRACT_ADDRESS = "${market.address}";
export const ROCKETCHARACTER_CONTRACT_ADDRESS = "${rocketCharacter.address}";
export const ROCKETPART_CONTRACT_ADDRESS = "${rocketPart.address}";
export const SOUNDEFFECT_CONTRACT_ADDRESS = "${soundEffect.address}";
  `;

  fs.writeFileSync(
    path.join(__dirname, "../client/contract_addresses.js"),
    config
  );

  const envConfig = `ROCKETPART_CONTRACT_ADDRESS="${rocketPart.address}"\nSOUNDEFFECT_CONTRACT_ADDRESS="${soundEffect.address}"`;
  const envConfigFile = path.join(__dirname, "../load_contract_vars");
  fs.writeFileSync(envConfigFile, envConfig);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
