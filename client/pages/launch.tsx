import React, { useEffect, useState, useRef, MutableRefObject } from "react";
import { BigNumber } from "@ethersproject/bignumber";
import { useRouter } from "next/router";
import { Howl } from "howler";
import { Contract } from "ethers";
import eth from "../support/eth";
import NavBar from "./components/NavBar";
import {
  SpaceObject,
  spaceObjects,
  SoundEffects,
  updateSpaceObject,
  RocketData,
  RocketAttributes,
  SoundEffectsKey,
} from "../support/gameHelpers/gameObjectUtils";
import { createContractClient } from "../support/gameHelpers/contractUtils";
import {
  buttonAction,
  loadButtons,
  ButtonObject,
  updateButtons,
  checkButtonClicked,
} from "../support/gameHelpers/buttonUtils";
import {
  splitImageParts,
  setBackgroundAlpha,
} from "../support/gameHelpers/canvasUtils";
import {
  endSummary,
  updateFuel,
  updatecredits,
  loadingPane,
} from "../support/gameHelpers/guiUtils";

const Launch = () => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [loadingIssue, setLoadingIssue] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const canvasBack: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
  const sceneRef: any = useRef(undefined);

  const rocketData: MutableRefObject<RocketData> = useRef({
    fuel: 0,
    currentFuel: 0,
    maxSpeed: 0,
    imageData: "",
    earnings: 0,
    offline: 0,
  });

  const rocketAttributes: MutableRefObject<RocketAttributes> = useRef({
    earningsIndex: BigNumber.from("1"),
    fuelIndex: BigNumber.from("1"),
    imageURI: "",
    offlineIndex: BigNumber.from("1"),
    speedIndex: BigNumber.from("1"),
    rocketId: 0,
  });

  const gameButtons: MutableRefObject<any> = useRef({});

  const router = useRouter();

  const soundEffects: SoundEffects = {};

  let loading = false;

  // quick setup
  let imgHeight = 0;
  let scrollSpeed = 0;
  let mouseDown = false;
  let mouseClicked = false;
  let backgroundAlpha = 1;
  let backgroundHeight = 10000;
  let launched = false;
  let endGame = false;
  let rocketHeight = 0;

  const gameDefaults = {
    initialSpeed: 2700,
    initialFuel: 30,
    initialEarnings: 0,
    initialOffline: 1,
    speedUpgradeIncrement: 340,
    fuelUpgradeIncrement: 7,
    earningsUpgradeIncrement: 2,
    offlineUpgradeIncrement: 2,
  };

  let contractClient: any;

  // Image data
  let rocketImg: HTMLImageElement;
  let rocketFire: HTMLImageElement;
  let background: HTMLImageElement;
  let stars: HTMLImageElement;
  let launchPad: HTMLImageElement;
  let rocketFireLoaded = false;
  let rocketImgLoaded = false;
  let backgroundImgLoaded = false;
  let starsImgLoaded = false;
  let launchPadImgLoaded = false;
  let launchPadPos: number;

  let cone: HTMLCanvasElement | undefined;
  let middle: HTMLCanvasElement | undefined;
  let end: HTMLCanvasElement | undefined;

  let coneFuel: number;
  let middleFuel: number;
  let bottomFuel: number;
  let currentSection = 2;
  let sections: number[];

  let conePos: number;
  let middlePos: number;
  let endPos: number;

  let disableMouse = false;

  let credits: number = 0;

  useEffect(() => {
    const { ethereum } = window;
    eth.isWalletConnected(ethereum, currentAccount, setCurrentAccount);
  }, [currentAccount]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    if (currentAccount) {
      try {
        const { ethereum } = window;
        const contract = eth.getRocketCharacterContract(ethereum);
        const soundsContract = eth.getSoundEffectContract(ethereum);
        if (contract && soundsContract) {
          init(contract, soundsContract, ethereum);
        }
      } catch (err) {
        console.log(err);
        setLoadingIssue;
      }
    }
    if (sceneRef.current) {
      setWidth(sceneRef.current.offsetWidth);
      setHeight(sceneRef.current.offsetHeight - 60);
    }
    return () => {
      soundEffects?.background?.stop();
    };
  }, [currentAccount]);

  const speedButtonHandler = async () => {
    const updatedCredits = await buttonAction(
      gameButtons.current.speedButton,
      rocketAttributes.current.speedIndex,
      gameDefaults.speedUpgradeIncrement,
      rocketData.current,
      "maxSpeed",
      gameDefaults.initialSpeed,
      credits,
      contractClient
    );
    credits = updatedCredits;
    gameButtons.current.speedButton.valueText = `${rocketData.current?.maxSpeed} mph`;
    gameButtons.current.speedButton.clicked = true;
  };

  const fuelButtonHandler = async () => {
    const updatedCredits = await buttonAction(
      gameButtons.current.fuelButton,
      rocketAttributes.current.fuelIndex,
      gameDefaults.fuelUpgradeIncrement,
      rocketData.current,
      "fuel",
      gameDefaults.initialFuel,
      credits,
      contractClient
    );
    credits = updatedCredits;
    gameButtons.current.fuelButton.valueText = `${rocketData.current?.fuel} kgal`;
    setFuelSections();
    gameButtons.current.fuelButton.clicked = true;
  };

  const earningsButtonHandler = async () => {
    const updatedCredits = await buttonAction(
      gameButtons.current.earningsButton,
      rocketAttributes.current.earningsIndex,
      gameDefaults.earningsUpgradeIncrement,
      rocketData.current,
      "earnings",
      gameDefaults.initialEarnings,
      credits,
      contractClient
    );
    credits = updatedCredits;
    gameButtons.current.earningsButton.valueText = `+${rocketData.current?.earnings}%`;
    gameButtons.current.earningsButton.clicked = true;
  };

  const offlineButtonHandler = async () => {
    const updatedCredits = await buttonAction(
      gameButtons.current.offlineButton,
      rocketAttributes.current.offlineIndex,
      gameDefaults.offlineUpgradeIncrement,
      rocketData.current,
      "offline",
      gameDefaults.initialOffline,
      credits,
      contractClient
    );
    credits = updatedCredits;
    gameButtons.current.offlineButton.valueText = `+${rocketData.current?.offline}c/min`;
    gameButtons.current.offlineButton.clicked = true;
  };

  const flightPlanButtonHandler = async () => {
    gameButtons.current.flightPlanButton.clicked = true;
    loading = true;
    try {
      await contractClient.submitFlightPlan(
        rocketAttributes.current.rocketId,
        gameButtons.current.speedButton.upgradeClickIndex,
        gameButtons.current.fuelButton.upgradeClickIndex,
        gameButtons.current.earningsButton.upgradeClickIndex,
        gameButtons.current.offlineButton.upgradeClickIndex
      );
    } catch (err) {
      console.log("flightPlanButtonHandler error: ", err);
      loading = false;
    }
  };

  const logFlightButtonHander = async () => {
    gameButtons.current.logFlightButton.clicked = true;
    loading = true;
    try {
      credits = await contractClient.logFlight(
        rocketAttributes.current.rocketId,
        rocketHeight
      );
      gameButtons.current.speedButton.maxReached = false;
      gameButtons.current.fuelButton.maxReached = false;
      gameButtons.current.earningsButton.maxReached = false;
      gameButtons.current.offlineButton.maxReached = false;
      loading = false;
    } catch (err) {
      console.log(err);
      loading = false;
    }
    if (sceneRef.current) {
      setGameValues();
    }
  };

  const updateRocketAttributes = async (rocketAttributesResp: any) => {
    const { imageURI, earningsIndex, fuelIndex, offlineIndex, speedIndex } =
      rocketAttributesResp;
    rocketAttributes.current = {
      ...rocketAttributes.current,
      ...rocketAttributesResp,
    };
    const balanceAmount =
      await contractClient.rocketCharacterContract.getBalance();
    credits = balanceAmount.toNumber();
    const speedAmount = await contractClient.newAmount(
      speedIndex,
      0,
      gameDefaults.speedUpgradeIncrement,
      gameDefaults.initialSpeed
    );
    const fuelAmount = await contractClient.newAmount(
      fuelIndex,
      0,
      gameDefaults.fuelUpgradeIncrement,
      gameDefaults.initialFuel
    );
    const earningAmount = await contractClient.newAmount(
      earningsIndex,
      0,
      gameDefaults.earningsUpgradeIncrement,
      gameDefaults.initialEarnings
    );
    const offlineAmount = await contractClient.newAmount(
      offlineIndex,
      0,
      gameDefaults.offlineUpgradeIncrement,
      gameDefaults.initialOffline
    );
    const imagePath = eth.toIpfsGatewayURL(imageURI);
    const speedCost = await contractClient.newCost(speedIndex, 0);
    const fuelCost = await contractClient.newCost(fuelIndex, 0);
    const earningsCost = await contractClient.newCost(earningsIndex, 0);
    const offlineCost = await contractClient.newCost(offlineIndex, 0);
    rocketData.current = {
      fuel: fuelAmount,
      currentFuel: fuelAmount,
      maxSpeed: speedAmount,
      imageData: imagePath.href,
      earnings: earningAmount,
      offline: offlineAmount,
    };
    setGameValues();
    setFuelSections();
    gameButtons.current = loadButtons(rocketData.current, {
      speedButtonHandler,
      fuelButtonHandler,
      earningsButtonHandler,
      offlineButtonHandler,
      flightPlanButtonHandler,
      logFlightButtonHander,
    });
    gameButtons.current.speedButton.upgradeCost = speedCost;
    gameButtons.current.fuelButton.upgradeCost = fuelCost;
    gameButtons.current.earningsButton.upgradeCost = earningsCost;
    gameButtons.current.offlineButton.upgradeCost = offlineCost;
  };

  const RocketCharacterAttributesChangedHandler = async (
    _sender: string,
    _rocketId: BigNumber,
    rocketAttributes: any
  ) => {
    loading = false;
    await updateRocketAttributes(rocketAttributes);
  };

  const init = async (
    contract: Contract,
    soundContract: Contract,
    ethereum: any
  ) => {
    try {
      contractClient = createContractClient(
        contract,
        ethereum,
        RocketCharacterAttributesChangedHandler
      );
      const rocketIds = await contract.getRocketsOwned();
      let soundPack = await soundContract.getSoundEffectsPack();
      if (soundPack.length === 0) {
        const soundEffects = await soundContract.getSoundEffects();
        soundPack = new Array(4)
          .fill(null)
          .map((_, index) =>
            soundEffects.find((f: any) => f.audioType === index)
          );
      }
      soundPack.map((soundEffect: any) => {
        const key: SoundEffectsKey = soundEffect.name.toLowerCase();
        const url = eth.toIpfsGatewayURL(soundEffect.audioURI);
        const properties = {
          src: [url.href],
          format: ["mp3"],
          loop: false,
          volume: 1,
        };
        if (key === "background") {
          properties.loop = true;
          properties.volume = 0.1;
        }
        soundEffects[key] = new Howl(properties);
      });
      if (rocketIds.length === 0) {
        return router.push("/hanger");
      }
      const selectedRocket = localStorage.getItem("selectedRocket");
      const rocketIdValues = rocketIds.map(Number);
      const selectedRocketVal = Number(selectedRocket);
      const rocketIndex = rocketIdValues.indexOf(selectedRocketVal);
      const rocketId = rocketIndex > -1 ? rocketIds[rocketIndex] : rocketIds[0];
      const rocketAttributesResp = await contract.getTokenAttributes(rocketId);
      rocketAttributes.current = { ...rocketAttributesResp, rocketId };
      await updateRocketAttributes(rocketAttributes.current);
      if (canvasBack.current) {
        canvasBack.current.addEventListener(
          "mousedown",
          handleMouseDown,
          false
        );
        canvasBack.current.addEventListener("mouseup", handleMouseUp, false);
      }
      soundEffects?.background?.play();
      loadImages();
      gameLoop();
    } catch (err) {
      console.log(err);
    }
  };

  const setFuelSections = () => {
    const sectionFuel = rocketData.current.fuel / 3;
    coneFuel = sectionFuel;
    middleFuel = sectionFuel;
    bottomFuel = sectionFuel;
    sections = [bottomFuel, middleFuel, coneFuel];
  };

  const setGameValues = () => {
    if (canvasBack.current) {
      imgHeight = 0;
      scrollSpeed = 0;
      mouseDown = false;
      backgroundAlpha = 1;
      backgroundHeight = 10000;
      launched = false;
      endGame = false;
      rocketHeight = 0;
      conePos = -370;
      middlePos = -300;
      endPos = -170;
      setFuelSections();
      currentSection = 2;
      launchPadPos = -650;
    }
  };

  const handleResize = () => {
    if (sceneRef.current) {
      if (canvasBack.current) {
        canvasBack.current.height = sceneRef.current.offsetHeight;
        const ctx = canvasBack.current.getContext("2d");
        if (!ctx) {
          return;
        }
        const background = new Image();
        background.src = "/background2.png";
        background.onload = () => {
          if (sceneRef.current) {
            ctx.drawImage(
              background,
              0,
              0,
              sceneRef.current.offsetWidth,
              sceneRef.current.offsetHeight
            );
          }
        };
      }
      setWidth(sceneRef.current.offsetWidth);
      setHeight(sceneRef.current.offsetHeight - 60);
    }
  };

  const loadSpaceObject = (spaceObject: SpaceObject): SpaceObject => {
    if (spaceObject.img) {
      spaceObject.img.src = spaceObject.src;
      spaceObject.img.onload = () => {
        spaceObject.imgLoaded = true;
      };
    }
    return spaceObject;
  };

  const updateLaunchPad = (
    ctx: CanvasRenderingContext2D,
    scrollSpeed: number,
    x: number,
    y: number
  ) => {
    if (launched) {
      launchPadPos += scrollSpeed;
    }
    if (launchPadImgLoaded) {
      ctx.drawImage(launchPad, x - 380, y + launchPadPos, 600, 650);
    }
  };

  const updateBackground = (ctx: CanvasRenderingContext2D) => {
    if (backgroundImgLoaded && starsImgLoaded) {
      ctx.globalAlpha = 1;
      if (sceneRef.current) {
        ctx.drawImage(
          stars,
          0,
          imgHeight,
          sceneRef.current.offsetWidth,
          backgroundHeight
        );
        // draw stars image 2
        ctx.drawImage(
          stars,
          0,
          imgHeight - backgroundHeight,
          sceneRef.current.offsetWidth,
          backgroundHeight
        );
        ctx.globalAlpha = backgroundAlpha;
        // draw image 1
        ctx.drawImage(
          background,
          0,
          imgHeight,
          sceneRef.current.offsetWidth,
          backgroundHeight
        );
        // draw image 2
        ctx.globalAlpha = backgroundAlpha;
        ctx.drawImage(
          background,
          0,
          imgHeight - backgroundHeight,
          sceneRef.current.offsetWidth,
          backgroundHeight
        );
        // draw text
        if (!rocketData.current) {
          ctx.fillText("Loading", 10, 50);
        }
      }
    }
    backgroundAlpha = setBackgroundAlpha(rocketHeight);
  };

  const loadImages = () => {
    spaceObjects.map((sp) => {
      sp.img = new Image();
      loadSpaceObject(sp);
    });
    rocketImg = new Image();
    rocketFire = new Image();
    background = new Image();
    stars = new Image();
    launchPad = new Image();

    rocketImg.src = rocketData.current.imageData;
    rocketFire.src = "/fire1.png";
    background.src = "/background2.png";
    stars.src = "/background3.png";
    launchPad.src = "/launchStand.png";

    rocketFire.onload = () => {
      rocketFireLoaded = true;
    };
    rocketImg.onload = () => {
      rocketImgLoaded = true;
      [cone, middle, end] = splitImageParts(rocketImg);
    };
    background.onload = () => {
      backgroundImgLoaded = true;
    };
    stars.onload = () => {
      starsImgLoaded = true;
    };
    launchPad.onload = () => {
      launchPadImgLoaded = true;
    };
  };

  const updateRocket = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    if (rocketFireLoaded && rocketImgLoaded) {
      ctx.globalAlpha = scrollSpeed > 0 ? 1 : 0;
      if (rocketData.current.currentFuel > 0 && mouseDown) {
        if (currentSection === 1) {
          ctx.drawImage(rocketFire, x / 2 - 82, y + middlePos + 120, 65, 100);
        } else if (currentSection === 0) {
          ctx.drawImage(rocketFire, x / 2 - 82, y + conePos + 55, 65, 100);
        } else {
          ctx.drawImage(rocketFire, x / 2 - 82, y + endPos + 90, 65, 100);
        }
      }

      ctx.globalAlpha = 1;
      const rocketX = x / 2 - 200;
      const rocketY = y;
      if (cone && middle && end) {
        ctx.drawImage(cone, rocketX, rocketY + conePos, 300, 70);
        ctx.drawImage(middle, rocketX, rocketY + middlePos, 300, 130);
        ctx.drawImage(end, rocketX, rocketY + endPos, 300, 100);
      }
    }
  };

  const gameLoop = () => {
    if (canvasBack.current) {
      const x = canvasBack.current.width;
      const y = canvasBack.current.height / 2;
      const ctx = canvasBack.current.getContext("2d");
      if (ctx) {
        updateBackground(ctx);
        updatecredits(ctx, x - 350, y - 250, launched, endGame, credits);
        updateButtons(ctx, x, y, launched, endGame, gameButtons.current);
        spaceObjects.map((sp) =>
          updateSpaceObject(ctx, sp, x, rocketHeight, scrollSpeed, endGame)
        );
        updateRocket(ctx, x, y * 2);
        updateLaunchPad(ctx, scrollSpeed, x / 2, y * 2);
        updateFuel(
          ctx,
          y - 280,
          rocketData.current.currentFuel,
          rocketData.current
        );
        endSummary(
          ctx,
          x / 2,
          y,
          rocketHeight,
          endGame,
          gameButtons.current.logFlightButton
        );
        loadingPane(ctx, x, y * 2, loading);
      }
    }
    rocketData.current.currentFuel = sections[currentSection];

    if (launched && rocketData) {
      if (mouseClicked) {
        currentSection--;
        rocketData.current.currentFuel = sections[currentSection];
        mouseClicked = false;
      }
      rocketHeight += (0.01 * Math.floor(rocketData.current?.maxSpeed)) / 100;
      imgHeight += scrollSpeed;
      if (imgHeight > backgroundHeight) {
        imgHeight = 0;
      }
      if (rocketData.current.currentFuel > 0) {
        if (mouseDown) {
          scrollSpeed >= 500 ? (scrollSpeed = 500) : (scrollSpeed += 2);
          rocketData.current.currentFuel -= 0.05;
          if (!soundEffects?.thrust?.playing()) {
            soundEffects?.thrust?.play();
          }
        } else {
          if (soundEffects?.thrust?.playing()) {
            soundEffects?.thrust?.stop();
          }
          scrollSpeed -= 2;
        }
      } else {
        if (soundEffects?.thrust?.playing()) {
          soundEffects.thrust.stop();
        }
        if (currentSection > 0 && !soundEffects?.explosion?.playing()) {
          soundEffects?.explosion?.play();
        }
        disableMouse = true;
        // slow scroll
        if (scrollSpeed > 0) {
          scrollSpeed -= 10;
          // slow rocket
        } else if (conePos < 1000 || middlePos < 1000 || endPos < 1000) {
          conePos += 10;
          middlePos += 10;
          endPos += 10;
          // end game
        } else {
          disableMouse = false;
          launched = false;
          endGame = true;
        }
      }
      if (currentSection === 1) {
        endPos += 10;
      }
      if (currentSection == 0) {
        endPos += 10;
        middlePos += 10;
      }
      if (scrollSpeed <= 0) {
        scrollSpeed = 0;
        rocketData.current.currentFuel = 0;
      }
      sections[currentSection] = rocketData.current.currentFuel;
    }
    window.requestAnimationFrame(gameLoop);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (canvasBack.current && !loading && !disableMouse) {
      mouseDown = true;
      const x = canvasBack.current.width;
      const y = canvasBack.current.height / 2 + 60;
      if (
        checkButtonClicked(
          gameButtons.current.logFlightButton,
          e,
          canvasBack.current.width / 2,
          y,
          50
        ) &&
        endGame
      ) {
        soundEffects?.ping?.play();
        return gameButtons.current.logFlightButton.action();
      }
      if (!endGame) {
        const buttons = [
          gameButtons.current.speedButton,
          gameButtons.current.fuelButton,
          gameButtons.current.earningsButton,
          gameButtons.current.offlineButton,
          gameButtons.current.flightPlanButton,
        ];

        for (let i = 0; i < buttons.length; i++) {
          const button = buttons[i];
          if (checkButtonClicked(button, e, x, y) && !launched) {
            soundEffects?.ping?.play();
            return button.action();
          }
        }
        launched = true;
      } else {
        if (sceneRef.current) {
          setGameValues();
        }
      }
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (disableMouse) {
      return;
    }
    mouseDown = false;
    [
      gameButtons.current.speedButton,
      gameButtons.current.fuelButton,
      gameButtons.current.earningsButton,
      gameButtons.current.offlineButton,
      gameButtons.current.flightPlanButton,
      gameButtons.current.logFlightButton,
    ].map((button: ButtonObject) => {
      if (button.clicked) {
        button.clicked = false;
      }
    });
    if (launched) {
      mouseClicked = true;
    }
  };

  return (
    <div className="h-screen" ref={sceneRef}>
      <NavBar />
      <div>
        {loadingIssue ? (
          <main className="flex flex-col items-center w-full h-full">
            <h1 className="text-lg font-bold">Oh oh something went wrong!</h1>
            <a className="p-2 bg-red-500 rounded" href="/">
              Back to Main
            </a>
          </main>
        ) : (
          <main className="w-full h-full">
            <canvas width={width} height={height} ref={canvasBack} />
          </main>
        )}
      </div>
    </div>
  );
};

export default Launch;
