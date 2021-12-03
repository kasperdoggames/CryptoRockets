import { Contract } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import eth from "../eth";

export type ContractClient = {
  rocketCharacterContract: Contract;
  newAmount: (
    index: BigNumber,
    step: number,
    upgradeIncrement: number,
    initial: number
  ) => Promise<any>;
  newCost: (index: BigNumber, step: number) => Promise<number>;
  submitFlightPlan: (
    rocketId: number,
    speedClicked: number,
    fuelClicked: number,
    earnings: number,
    offline: number
  ) => Promise<string>;
  logFlight: (rocketId: number, rocketHeight: number) => Promise<number>;
};

export const getContractAmount = async (
  rocketCharacterContract: Contract,
  index: BigNumber,
  step: number,
  upgradeIncrement: number,
  initial: number
): Promise<number> => {
  const value = await rocketCharacterContract.newAmount(
    index,
    step,
    upgradeIncrement,
    initial
  );
  return value.toNumber();
};

export const createContractClient = (
  rocketCharacterContract: Contract,
  ethereum: any,
  handler: any
): ContractClient => {
  eth.setupEventListener(
    ethereum,
    rocketCharacterContract,
    "RocketCharacterAttributesChanged",
    handler
  );
  return {
    rocketCharacterContract,
    newAmount: (
      index: BigNumber,
      step: number,
      upgradeIncrement: number,
      initial: number
    ) =>
      getContractAmount(
        rocketCharacterContract,
        index,
        step,
        upgradeIncrement,
        initial
      ),
    newCost: async (index: BigNumber, step: number) => {
      const val = await rocketCharacterContract.newCost(index, step);
      return val.toNumber();
    },
    submitFlightPlan: async (
      rocketId: number,
      speedClicked: number,
      fuelClicked: number,
      earnings: number,
      offline: number
    ) => {
      const tx = await rocketCharacterContract.logFlightPlan(
        rocketId,
        speedClicked,
        fuelClicked,
        earnings,
        offline
      );
      await tx.wait();
      return "completed";
    },
    logFlight: async (rocketId: number, rocketHeight: number) => {
      const heightVal = Math.floor(rocketHeight);
      const tx = await rocketCharacterContract.logFlight(rocketId, heightVal);
      await tx.wait();
      const balanceResp = await rocketCharacterContract.getBalance();
      return balanceResp.toNumber();
    },
  };
};
