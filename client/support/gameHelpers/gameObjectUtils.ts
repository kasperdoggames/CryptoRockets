import { BigNumber } from "@ethersproject/bignumber";
import { Howl } from "howler";

export type RocketDataKey = "maxSpeed" | "fuel" | "earnings" | "offline";

export type SoundEffectsKey = "background" | "thrust" | "ping" | "explosion";

export type SoundEffects = {
  background?: Howl;
  thrust?: Howl;
  ping?: Howl;
  explosion?: Howl;
};

export type RocketData = {
  fuel: number;
  currentFuel: number;
  maxSpeed: number;
  imageData: string;
  earnings: number;
  offline: number;
};

export type RocketAttributes = {
  imageURI: string;
  earningsIndex: BigNumber;
  fuelIndex: BigNumber;
  offlineIndex: BigNumber;
  speedIndex: BigNumber;
  rocketId: number;
};

export type SpaceObject = {
  img?: HTMLImageElement | null;
  src: string;
  x: number;
  y: number;
  height: number;
  width: number;
  initialHeight: number;
  triggerHeight: number;
  imgLoaded: Boolean;
  ignoreCanvasX?: Boolean;
};

export type GameDefaults = {
  initialSpeed: number;
  initialFuel: number;
  initialEarnings: number;
  initialOffline: number;
  speedUpgradeIncrement: number;
  fuelUpgradeIncrement: number;
  earningsUpgradeIncrement: number;
  offlineUpgradeIncrement: number;
};

export const updateSpaceObject = (
  ctx: CanvasRenderingContext2D,
  spaceObject: SpaceObject,
  x: number,
  rocketHeight: number,
  scrollSpeed: number,
  endGame: Boolean
) => {
  if (
    spaceObject.img &&
    spaceObject.imgLoaded &&
    rocketHeight > spaceObject.triggerHeight
  ) {
    if (endGame || spaceObject.y > 2000) {
      spaceObject.y = spaceObject.initialHeight;
    }
    ctx.drawImage(
      spaceObject.img,
      spaceObject.ignoreCanvasX ? spaceObject.x : x + spaceObject.x,
      spaceObject.y,
      spaceObject.width,
      spaceObject.height
    );
    if (scrollSpeed > 0) {
      spaceObject.y += 3;
    }
  }
};

export const spaceObjects: SpaceObject[] = [
  {
    src: "/planet.png",
    x: -700,
    y: -2000,
    imgLoaded: false,
    initialHeight: -2000,
    triggerHeight: 1500,
    height: 1200,
    width: 1200,
  },
  {
    src: "/planet2.png",
    x: -400,
    y: -5000,
    imgLoaded: false,
    initialHeight: -5000,
    triggerHeight: 1500,
    height: 1200,
    width: 1200,
    ignoreCanvasX: true,
  },
];
