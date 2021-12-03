import { ButtonObject, createLogFlightButton } from "./buttonUtils";
import { RocketData } from "./gameObjectUtils";
import { roundRect } from "./canvasUtils";

export const endSummary = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rocketHeight: number,
  endGame: boolean,
  logFlightButton: ButtonObject
) => {
  if (endGame) {
    ctx.fillStyle = "grey";
    const startx = x - 200;
    const startY = y - 330;
    const endX = startx + 400;
    const endY = startY + 200;
    roundRect(ctx, startx, startY, endX, endY);
    createLogFlightButton(ctx, x, y, logFlightButton);
    ctx.textAlign = "center";
    ctx.font = "30px galiver-sans";
    ctx.fillStyle = "white";
    ctx.fillText("GAME OVER", x, startY + 50);
    ctx.font = "24px galiver-sans";
    ctx.fillText(
      `HEIGHT REACHED: ${Math.floor(rocketHeight)}`,
      x,
      startY + 100
    );
    ctx.textAlign = "start";
  }
};

export const updateFuel = (
  ctx: CanvasRenderingContext2D,
  y: number,
  fuel: number,
  rocketData: RocketData
) => {
  const fuelGaugeLength = 600;
  if (fuel > 0) {
    const maxRocketFuel = rocketData.fuel / 3;
    const x = 20;
    // frame
    ctx.fillStyle = "yellow";
    roundRect(ctx, x - 5, y - 40, 85, fuelGaugeLength + 150);
    // label
    ctx.textAlign = "start";
    ctx.font = "20px galiver-sans";
    ctx.fillStyle = "black";
    ctx.fillText("FUEL", x + 8, y - 10);
    //guage
    ctx.fillStyle = "grey";
    ctx.fillRect(x, y, 60, fuelGaugeLength);
    // level
    const level = (fuel / maxRocketFuel) * 100;
    const scaledLevel = level * 6;
    ctx.fillStyle = level > 20 ? "#049669" : "red";
    const yPos = y + fuelGaugeLength - scaledLevel;
    ctx.fillRect(x, yPos, 60, scaledLevel);
  }
};

export const updatecredits = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  launched: boolean,
  endGame: boolean,
  credits: number
) => {
  if (!launched && !endGame) {
    ctx.font = "50px galiver-sans";
    ctx.fillStyle = "white";
    ctx.textAlign = "start";
    ctx.fillText(`${credits}c`, x, y);
  }
};

export const loadingPane = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  loading: boolean
) => {
  if (loading) {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "grey";
    ctx.fillRect(0, 0, x, y);
    ctx.globalAlpha = 1;
  }
};
