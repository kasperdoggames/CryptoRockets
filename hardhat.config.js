require("@nomiclabs/hardhat-waffle");

require("./tasks/accounts/accounts");
require("./tasks/rockets/generate_rocket_character");
require("./tasks/rockets/generate_rocket_part");
require("./tasks/rockets/populate_rocket_parts");
require("./tasks/rockets/get_token_attributes");
require("./tasks/soundeffects/generate_soundeffect");
require("./tasks/soundeffects/populate_soundeffects");

require("dotenv").config();

module.exports = {
  solidity: "0.8.3",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // rinkeby: {
    //   url: process.env.RINKEBY_RPC_URL,
    //   accounts: [process.env.RINKEBY_KEY],
    // },
  },
};
