import { ethers } from "ethers";

import RocketCharacterJson from "../../artifacts/contracts/RocketCharacter.sol/RocketCharacter.json";
import RocketPartJson from "../../artifacts/contracts/RocketPart.sol/RocketPart.json";
import MarketJson from "../../artifacts/contracts/Market.sol/Market.json";
import SoundEffectJson from "../../artifacts/contracts/SoundEffect.sol/SoundEffect.json";

import {
  ROCKETCHARACTER_CONTRACT_ADDRESS,
  ROCKETPART_CONTRACT_ADDRESS,
  MARKET_CONTRACT_ADDRESS,
  SOUNDEFFECT_CONTRACT_ADDRESS,
} from "../contract_addresses";
import { toGatewayURL } from "nft.storage";

const IPFS_GATEWAY = "https://ipfs.io/ipfs";
// const IPFS_GATEWAY = "http://localhost:8080";

const setupEventListener = async (
  ethereum,
  connectedContract,
  eventName,
  handler
) => {
  try {
    console.log("Setting up event listeners");
    if (connectedContract) {
      connectedContract.on(eventName, handler);
    }
  } catch (error) {
    console.log(error);
  }
};
// const setupEventListener = async () => {
//   try {
//     console.log("Setting up event listeners");
//     const { ethereum } = window;
//     const connectedContract = getRocketCharacterContract(ethereum);
//     if (connectedContract) {
//       connectedContract.on("RocketCharacterMinted", async (owner, tokenId) => {
//         console.log(`RocketCharacter #${tokenId} minted by ${owner}`);
//       });
//       connectedContract.on(
//         "RocketCharacterAttributesChanged",
//         async (owner, tokenId, rocketCharacterAttributes) => {
//           console.log(
//             `RocketCharacterAttributesChanged #${tokenId} owned by ${owner} with attributes ${rocketCharacterAttributes}`
//           );
//         }
//       );
//       connectedContract.on(
//         "OfflineBonusAdded",
//         async (owner, tokenId, amount) => {
//           console.log(
//             `Offline bonus of ${amount} added for rocket #${tokenId} owned by ${owner}`
//           );
//         }
//       );
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

const getMarketContract = (ethereum: any) => {
  if (MarketJson.abi) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const marketContract = new ethers.Contract(
      MARKET_CONTRACT_ADDRESS,
      MarketJson.abi,
      signer
    );

    return marketContract;
  }
};

const getRocketCharacterContract = (ethereum: any) => {
  if (RocketCharacterJson.abi) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const rocketCharacterContract = new ethers.Contract(
      ROCKETCHARACTER_CONTRACT_ADDRESS,
      RocketCharacterJson.abi,
      signer
    );

    return rocketCharacterContract;
  }
};

const getRocketPartContract = (ethereum: any) => {
  if (RocketPartJson.abi) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const rocketPartContract = new ethers.Contract(
      ROCKETPART_CONTRACT_ADDRESS,
      RocketPartJson.abi,
      signer
    );

    return rocketPartContract;
  }
};
const getSoundEffectContract = (ethereum: any) => {
  if (SoundEffectJson.abi) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const soundEffectContract = new ethers.Contract(
      SOUNDEFFECT_CONTRACT_ADDRESS,
      SoundEffectJson.abi,
      signer
    );

    return soundEffectContract;
  }
};

const isWalletConnected = async (
  ethereum: any,
  currentAccount: string,
  setCurrentAccount: any
) => {
  if (!ethereum) {
    console.log("Make sure you have metamask!");
    return;
  } else {
    console.log("We have the ethereum object", ethereum);
  }

  const accounts = await ethereum.request({ method: "eth_accounts" });
  console.log({ accounts });
  console.log(
    `window.ethereum.networkVersion:${window.ethereum.networkVersion}`
  );
  if (
    window.ethereum.networkVersion !== "4" &&
    window.ethereum.networkVersion != "1337"
  ) {
    alert(
      "This only runs on Rinkeby and localhost...change your Wallet network selection"
    );
    return;
  }

  if (accounts.length !== 0) {
    const account = accounts[0];
    if (account !== currentAccount) {
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    }
  } else {
    setCurrentAccount("");
    console.log("No authorized account found");
  }
};

const connectWallet = async (setCurrentAccount) => {
  try {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Get MetaMask!");
      return;
    }

    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });

    console.log("Connected", accounts[0]);
    setCurrentAccount(accounts[0]);
  } catch (error) {
    console.log(error);
  }
};

const toIpfsGatewayURL = (ipfsPath) => {
  return toGatewayURL(ipfsPath, {
    gateway: IPFS_GATEWAY,
  });
};

export default {
  isWalletConnected,
  getRocketCharacterContract,
  getRocketPartContract,
  getSoundEffectContract,
  getMarketContract,
  toIpfsGatewayURL,
  connectWallet,
  setupEventListener,
};
