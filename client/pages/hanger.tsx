import React, { useState, useEffect } from "react";
import NavBar from "./components/NavBar";
import eth from "../support/eth";
import WalletConnectButton from "./components/WalletConnectButton";
import { ethers } from "ethers";
import { ROCKETCHARACTER_CONTRACT_ADDRESS } from "../contract_addresses";
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

function Hanger() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [rocketsOwned, setRocketsOwned] = useState([]);
  const [marketItems, setMarketItems] = useState([]);
  const [selected, setSelected] = useState(0);

  const processingIndicator = useProcessingIndicator();

  const setupEventListeners = (ethereum: any) => {
    eth.setupEventListener(
      ethereum,
      eth.getMarketContract(ethereum),
      "MarketItemCreated",
      () => {
        console.log("MarketItemCreated event fired");
        getRocketsOwned();
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
        getRocketsOwned();
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

  const getRocketsOwned = async () => {
    try {
      processingIndicator.setProcessing(true);
      const { ethereum } = window;
      const rocketCharacterContract = eth.getRocketCharacterContract(ethereum);
      if (rocketCharacterContract) {
        const rocketIds = await rocketCharacterContract.getRocketsOwned();
        const rocketData = rocketIds.map(async (rocketId) => {
          const rocketAttributes =
            await rocketCharacterContract.getTokenAttributes(rocketId);
          const tokenId = Number(rocketAttributes.tokenId);
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
          const earnings = getAmount(
            Number(rocketAttributes.earningsIndex),
            earningsUpgradeIncrement,
            initialEarnings
          );
          const offline = getAmount(
            Number(rocketAttributes.offlineIndex),
            offlineUpgradeIncrement,
            initialOffline
          );
          return {
            tokenId,
            earnings,
            imagePath,
            maxSpeed,
            fuel,
            offline,
          };
        });
        Promise.all(rocketData).then((results) => {
          setRocketsOwned(results);
        });
        processingIndicator.setProcessing(false);
      }
    } catch (err) {
      processingIndicator.setProcessing(false);
      alert(err.message);
      console.log(err);
    }
  };

  const getSelectedRocket = () => {
    const savedRocket = localStorage.getItem("selectedRocket");
    const selectedRocket = savedRocket ? Number(savedRocket) : 0;
    setSelected(selectedRocket);
  };

  useEffect(() => {
    if (currentAccount) {
      getRocketsOwned();
      getMarketItems();
      getSelectedRocket();
    }
  }, [currentAccount]);

  const onConnect = () => {
    eth.connectWallet(setCurrentAccount);
  };

  const handleSellClick = async (_, tokenId) => {
    try {
      processingIndicator.setProcessing(true);
      const { ethereum } = window;
      if (ethereum) {
        const marketContract = eth.getMarketContract(ethereum);
        if (marketContract) {
          let listingPrice = await marketContract.getListingPrice();
          listingPrice = listingPrice.toString();
          const sellPrice = ethers.utils.parseUnits("0.025", "ether");
          await marketContract.setMarketForSale(
            ROCKETCHARACTER_CONTRACT_ADDRESS,
            tokenId,
            sellPrice,
            { value: listingPrice }
          );
          console.log(`Rocket #${tokenId} put up for sale on marketplace`);
        } else {
          processingIndicator.setProcessing(false);
        }
      }
    } catch (err) {
      processingIndicator.setProcessing(false);
      alert(err.message);
    }
  };

  const handleCancelSaleClick = async (_, itemId) => {
    try {
      processingIndicator.setProcessing(true);
      const { ethereum } = window;
      if (ethereum) {
        const marketContract = eth.getMarketContract(ethereum);
        if (marketContract) {
          await marketContract.cancelSale(
            ROCKETCHARACTER_CONTRACT_ADDRESS,
            itemId
          );
          console.log(`Market item #${itemId} sale cancelled`);
        } else {
          processingIndicator.setProcessing(false);
        }
      }
    } catch (err) {
      processingIndicator.setProcessing(false);
      alert(`Sorry, we were unable to cancel the sale. ${err?.code}`);
    }
  };

  const renderRockets = (rockets, isForSale) => {
    return (
      <>
        {isForSale && rockets.length > 0 ? (
          <div className="pt-4 pb-2 pl-4 text-xl text-white">Selling</div>
        ) : (
          <div className="pt-4 pb-2 pl-4 text-xl text-white">Launchable</div>
        )}
        <div className="flex flex-wrap justify-start mx-auto lg:w-[1000px]">
          {rockets.map((rocket, index) => (
            <div
              key={index}
              className="flex flex-col m-2 bg-gray-800 border-4 border-yellow-500 rounded-2xl"
            >
              <div className="flex">
                <img
                  className="w-[200px] h-[200px] p-4"
                  src={rocket.imagePath}
                />
                <div className="flex flex-col flex-wrap justify-center mr-4 space-y-4 text-white">
                  <div className="flex flex-col">
                    <div className="text-sm font-thin">Speed:</div>
                    <div className="text-xl font-bold">
                      {rocket.maxSpeed}
                      <span className="pl-1 text-sm font-thin">mph</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm font-thin">Fuel:</div>
                    <div className="text-xl font-bold">
                      {rocket.fuel}
                      <span className="pl-1 text-sm font-thin">kg</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm font-thin">Offline:</div>
                    <div className="text-xl font-bold">
                      <span className="pl-1 text-sm font-thin">£</span>
                      {rocket.offline}
                    </div>
                  </div>
                </div>
              </div>
              {isForSale ? (
                <div className="p-2">
                  <button
                    className="w-full h-10 font-bold text-white bg-green-600 rounded-xl"
                    onClick={(e) => handleCancelSaleClick(e, rocket.itemId)}
                  >
                    CANCEL SALE
                  </button>
                </div>
              ) : (
                <div className="flex p-2 space-x-2">
                  <button
                    onClick={() => {
                      localStorage.setItem("selectedRocket", rocket.tokenId);
                      setSelected(rocket.tokenId);
                    }}
                    className="w-full h-10 font-bold text-white bg-green-600 rounded-xl"
                  >
                    {selected === rocket.tokenId ? "SELECTED" : "SELECT"}
                  </button>
                  <button
                    className="w-full h-10 font-bold text-white border-2 border-green-600 rounded-xl"
                    onClick={(e) => handleSellClick(e, rocket.tokenId)}
                  >
                    SELL
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col items-center h-screen">
      <NavBar />
      <h1 className="py-4 text-5xl font-bold text-white">Rocket Hanger</h1>
      {currentAccount === "" ? (
        <WalletConnectButton onConnect={onConnect} />
      ) : rocketsOwned.length > 0 || marketItems.length > 0 ? (
        <div className="py-6">
          <div>{renderRockets(rocketsOwned, false)}</div>
          <div>{renderRockets(marketItems, true)}</div>
        </div>
      ) : (
        <div className="flex items-start flex-grow pt-10">
          <div className="flex flex-col items-center px-4 py-4 text-xl font-bold text-yellow-500 bg-indigo-600 border-4 border-yellow-500 rounded-2xl">
            <div>You have no rockets</div>
            <div>
              Goto{" "}
              <Link href="/builder">
                <a className="underline">Builder</a>
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

export default Hanger;
