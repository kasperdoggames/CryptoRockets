import React, { useState, useEffect } from "react";
import eth from "../support/eth";
import WalletConnectButton from "./components/WalletConnectButton";
import { ethers } from "ethers";
import { ROCKETCHARACTER_CONTRACT_ADDRESS } from "../contract_addresses";
import NavBar from "./components/NavBar";
import Link from "next/link";
import Footer from "./components/Footer";
import { useProcessingIndicator } from "../hooks/use-processing-indicator";

const initialSpeed = 2700;
const initialFuel = 30;
const initialEarnings = 0;
const initialOffline = 1;
const speedUpgradeIncrement = 340;
const fuelUpgradeIncrement = 7;
const earningsUpgradeIncrement = 2;
const offlineUpgradeIncrement = 2;

function MarketPlace() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [marketItems, setMarketItems] = useState([]);

  const processingIndicator = useProcessingIndicator();

  const setupEventListeners = (ethereum) => {
    eth.setupEventListener(
      ethereum,
      eth.getMarketContract(ethereum),
      "MarketItemCreated",
      () => {
        console.log("MarketItemCreated event fired");
        getMarketItems();
        processingIndicator.setProcessing(false);
      }
    );
    eth.setupEventListener(
      ethereum,
      eth.getMarketContract(ethereum),
      "MarketItemSold",
      () => {
        console.log("MarketItemSold event fired");
        getMarketItems();
        processingIndicator.setProcessing(false);
      }
    );
    eth.setupEventListener(
      ethereum,
      eth.getMarketContract(ethereum),
      "MarketItemSaleCancelled",
      () => {
        console.log("MarketItemSaleCancelled event fired");
        getMarketItems();
        processingIndicator.setProcessing(false);
      }
    );
  };

  useEffect(() => {
    const { ethereum } = window;
    eth.isWalletConnected(ethereum, currentAccount, setCurrentAccount);
  }, [currentAccount]);

  useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      ethereum.on("accountsChanged", () => {
        eth.isWalletConnected(ethereum, currentAccount, setCurrentAccount);
      });
      setupEventListeners(ethereum);
    }
  }, []);

  const getAmount = (index, increment, initalValue) =>
    (index - 1) * increment + initalValue;

  const getMarketItems = async () => {
    try {
      processingIndicator.setProcessing(true);
      const { ethereum } = window;
      const marketContract = eth.getMarketContract(ethereum);
      if (marketContract) {
        const marketItems = await marketContract.getMarketItems();
        const marketItemData = marketItems.map(async (marketItem) => {
          console.log(marketItem.tokenId);
          const rocketCharacterContract =
            eth.getRocketCharacterContract(ethereum);
          const rocketAttributes =
            await rocketCharacterContract.getTokenAttributes(
              marketItem.tokenId
            );
          const imagePath = eth.toIpfsGatewayURL(
            rocketAttributes.imageURI
          ).href;
          const maxSpeed = getAmount(
            Number(rocketAttributes.speedIndex),
            speedUpgradeIncrement,
            initialSpeed
          );
          const fuel = getAmount(
            Number(rocketAttributes.fuelIndex),
            fuelUpgradeIncrement,
            initialFuel
          );
          const offline = getAmount(
            Number(rocketAttributes.offlineIndex),
            offlineUpgradeIncrement,
            initialOffline
          );
          console.log(
            `price-parseUnits: ${ethers.utils.parseUnits("0.025", "ether")}`
          );
          console.log(`price: ${marketItem.price}`);
          console.log(
            `price-formatEther: ${ethers.utils.formatUnits(
              "25000000000000000"
            )}`
          );
          return {
            itemId: marketItem.itemId,
            tokenId: marketItem.tokenId,
            price: marketItem.price,
            imagePath,
            maxSpeed,
            fuel,
            offline,
          };
        });
        Promise.all(marketItemData).then((results) => {
          setMarketItems(results);
          processingIndicator.setProcessing(false);
        });
      }
    } catch (err) {
      processingIndicator.setProcessing(false);
      alert(err.message);
      console.log(err);
    }
  };

  useEffect(() => {
    if (currentAccount) {
      getMarketItems();
    }
  }, [currentAccount]);

  const onConnect = () => {
    eth.connectWallet(setCurrentAccount);
  };

  const handleBuyClick = async (_, tokenId) => {
    try {
      processingIndicator.setProcessing(true);
      console.log(`handleBuyClick ${tokenId}`);
      const { ethereum } = window;
      if (ethereum) {
        const marketContract = eth.getMarketContract(ethereum);
        if (marketContract) {
          const price = ethers.utils.parseUnits("0.025", "ether");
          console.log(`buying price: ${price}`);
          await marketContract.setMarketSold(
            ROCKETCHARACTER_CONTRACT_ADDRESS,
            tokenId,
            { value: price }
          );
          console.log(`Rocket #${tokenId} bought on marketplace`);
        } else {
          processingIndicator.setProcessing(false);
        }
      }
    } catch (err) {
      processingIndicator.setProcessing(false);
      alert(err.data.message);
    }
  };

  return (
    <div className="flex flex-col items-center h-screen">
      <NavBar />
      <h1 className="py-4 text-5xl font-bold text-white">Rocket Marketplace</h1>
      {currentAccount === "" ? (
        <WalletConnectButton onConnect={onConnect} />
      ) : marketItems.length > 0 ? (
        <div className="flex flex-wrap justify-start mx-auto lg:w-[1000px] py-6">
          {marketItems.map((marketItem, index) => (
            <div
              key={index}
              className="flex flex-col m-2 bg-gray-800 border-4 border-yellow-500 rounded-2xl"
            >
              <div className="flex">
                <img
                  className="w-[200px] h-[200px] p-4"
                  src={marketItem.imagePath}
                />
                <div className="flex flex-col flex-wrap justify-center mr-4 space-y-4 text-white">
                  <div className="flex flex-col">
                    <div className="text-sm font-thin">Speed:</div>
                    <div className="text-xl font-bold">
                      {marketItem.maxSpeed}
                      <span className="pl-1 text-sm font-thin">mph</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm font-thin">Fuel:</div>
                    <div className="text-xl font-bold">
                      {marketItem.fuel}
                      <span className="pl-1 text-sm font-thin">kg</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm font-thin">Offline:</div>
                    <div className="text-xl font-bold">
                      <span className="pl-1 text-sm font-thin">£</span>
                      {marketItem.offline}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex p-2 space-x-2 bg-gray-700 rounded-b-xl">
                <div className="flex items-center justify-center w-full text-lg font-bold text-white">
                  {`${ethers.utils.formatEther(marketItem.price)} ETH`}
                </div>
                <button
                  className="w-full h-10 font-bold text-white bg-green-600 rounded-xl"
                  onClick={(e) => handleBuyClick(e, marketItem.itemId)}
                >
                  BUY
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-start flex-grow pt-10">
          <div className="flex flex-col items-center px-4 py-4 text-xl font-bold text-yellow-500 bg-indigo-600 border-4 border-yellow-500 rounded-2xl">
            <div>No rockets for sale yet</div>
            <div>
              Goto{" "}
              <Link href="/hanger">
                <a className="underline">Hanger</a>
              </Link>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-end justify-center flex-grow h-full">
        <Footer />
      </div>
    </div>
  );
}

export default MarketPlace;
