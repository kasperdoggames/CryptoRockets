import { ContractClient } from "./contractUtils";
import { RocketData, RocketDataKey } from "./gameObjectUtils";
import { roundRect } from "./canvasUtils";
import { BigNumber } from "@ethersproject/bignumber";

export type ButtonObject = {
  primeColor: string;
  x: number;
  y: number;
  title: string;
  valueText: string;
  clicked: boolean;
  action: () => void;
  maxReached: boolean;
  upgradeCost: number;
  upgradeClickIndex: number;
};

export const createLogFlightButton = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  button: ButtonObject
) => {
  const buttonX = x + button.x;
  const buttonY = y + button.y;
  const clickedColor = "grey";
  ctx.fillStyle = button.clicked ? clickedColor : "#049669";
  const startx = buttonX;
  const startY = buttonY;
  const endX = buttonX + 200;
  const endY = buttonY + 50;
  roundRect(ctx, startx, startY, endX, endY);
  ctx.font = "20px galiver-sans";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(button.title, buttonX + 200 / 2, buttonY + 60 / 2);
};

export const createSubmitFlightButton = (
  ctx: CanvasRenderingContext2D,
  button: ButtonObject,
  x: number,
  y: number
) => {
  const buttonX = x + button.x;
  const buttonY = y + button.y;
  const clickedColor = "grey";
  ctx.fillStyle = button.clicked ? clickedColor : "#049669";
  const startx = buttonX;
  const startY = buttonY;
  const endX = buttonX + 200;
  const endY = buttonY + 50;
  roundRect(ctx, startx, startY, endX, endY);
  ctx.font = "20px galiver-sans";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(button.title, buttonX + 200 / 2, buttonY + 65 / 2);
};

export const buttonAction = async (
  button: ButtonObject,
  rocketAttribIndex: BigNumber,
  attribIncrement: number,
  rocketData: RocketData,
  rocketDataKey: RocketDataKey,
  initialValue: number,
  currentCredits: number,
  contractClient: ContractClient
) => {
  const updatedCredit = currentCredits - button.upgradeCost;
  if (rocketData) {
    if (updatedCredit >= 0) {
      try {
        button.maxReached = false;
        button.upgradeClickIndex += 1;
        const newAmount = await contractClient.newAmount(
          rocketAttribIndex,
          button.upgradeClickIndex,
          attribIncrement,
          initialValue
        );

        rocketData[rocketDataKey] = newAmount;
        const newCost = await contractClient.newCost(
          rocketAttribIndex,
          button.upgradeClickIndex
        );
        button.upgradeCost = newCost;
        return updatedCredit;
      } catch (err) {
        console.log(err);
        throw err;
      }
    } else {
      button.maxReached = true;
      return currentCredits;
    }
  } else {
    return currentCredits;
  }
};

export const createButton = (
  primeColor: string,
  secondColor: string,
  x: number,
  y: number,
  title: string,
  valueText: string,
  action: () => Promise<void>
) => {
  return {
    primeColor,
    secondColor,
    x,
    y,
    title,
    valueText,
    action,
    clicked: false,
    maxReached: false,
    upgradeCost: 0,
    upgradeClickIndex: 0,
  };
};

export const updateButtonStat = (
  ctx: CanvasRenderingContext2D,
  button: ButtonObject,
  x: number,
  y: number
) => {
  let primeColor = button.primeColor;
  let clickedColor = "grey";
  if (button.maxReached) {
    ctx.globalAlpha = 0.5;
    primeColor = "grey";
  }
  ctx.fillStyle = button.clicked ? clickedColor : primeColor;
  const buttonX = x + button.x;
  const buttonY = y + button.y;
  const startx = buttonX;
  const startY = buttonY;
  const endX = buttonX + 200;
  const endY = buttonY + 100;
  const textX = buttonX + 200 / 2;
  roundRect(ctx, startx, startY, endX, endY);
  ctx.textAlign = "center";
  ctx.font = "22px galiver-sans";
  ctx.fillStyle = "black";
  ctx.fillText(button.title, textX, buttonY + 32);
  ctx.font = "18px galiver-sans";
  ctx.fillStyle = "white";
  ctx.fillText(button.valueText, textX, buttonY + 60);
  ctx.fillStyle = "grey";
  ctx.fillRect(x + 60, y + 60, 80, 30);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(`${button.upgradeCost}c`, textX, buttonY + 85);
  ctx.globalAlpha = 1;
};

export const checkButtonClicked = (
  button: ButtonObject,
  e: MouseEvent,
  x: number,
  y: number,
  height: number = 100
) => {
  const buttonX = x + button.x;
  const buttonY = y + button.y;
  return (
    e.pageX > buttonX &&
    e.pageX < buttonX + 200 &&
    e.pageY > buttonY &&
    e.pageY < buttonY + height
  );
};

export const updateButtons = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  launched: boolean,
  endGame: boolean,
  buttons: {
    speedButton: ButtonObject;
    fuelButton: ButtonObject;
    earningsButton: ButtonObject;
    offlineButton: ButtonObject;
    flightPlanButton: ButtonObject;
  }
) => {
  ctx.globalAlpha = 1;
  if (!launched && !endGame) {
    const {
      speedButton,
      fuelButton,
      earningsButton,
      offlineButton,
      flightPlanButton,
    } = buttons;
    updateButtonStat(ctx, speedButton, x, y);
    updateButtonStat(ctx, fuelButton, x, y);
    updateButtonStat(ctx, earningsButton, x, y);
    updateButtonStat(ctx, offlineButton, x, y);
    createSubmitFlightButton(ctx, flightPlanButton, x, y);
  }
};

export const loadButtons = (rocketData: RocketData, handlers: any) => {
  const {
    speedButtonHandler,
    fuelButtonHandler,
    earningsButtonHandler,
    offlineButtonHandler,
    flightPlanButtonHandler,
    logFlightButtonHander,
  } = handlers;
  const speedButton = createButton(
    "#259DED",
    "#60C0FF",
    -350,
    -180,
    "SPEED",
    `${rocketData.maxSpeed} mph`,
    speedButtonHandler
  );
  const fuelButton = createButton(
    "#F4B600",
    "#EEDA55",
    -350,
    -70,
    "FUEL",
    `${rocketData.fuel} kgal`,
    fuelButtonHandler
  );
  const earningsButton = createButton(
    "#00C200",
    "#00E704",
    -350,
    40,
    "EARNINGS",
    `+${rocketData.earnings}%`,
    earningsButtonHandler
  );
  const offlineButton = createButton(
    "#FF00FF",
    "#FF75FF",
    -350,
    150,
    "OFFLINE",
    `+${rocketData.offline}c/min`,
    offlineButtonHandler
  );
  const flightPlanButton = createButton(
    "red",
    "red",
    -350,
    260,
    "LOG FLIGHT PLAN",
    "",
    flightPlanButtonHandler
  );
  const logFlightButton = createButton(
    "red",
    "red",
    -100,
    -200,
    "LOG YOUR FLIGHT",
    "",
    logFlightButtonHander
  );

  return {
    speedButton,
    fuelButton,
    earningsButton,
    offlineButton,
    flightPlanButton,
    logFlightButton,
  };
};
