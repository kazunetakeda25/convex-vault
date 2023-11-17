/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IBooster,
  IBoosterInterface,
} from "../../../../contracts/interfaces/Convex/IBooster";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_pid",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "_stake",
        type: "bool",
      },
    ],
    name: "deposit",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "poolInfo",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "lptoken",
            type: "address",
          },
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "address",
            name: "gauge",
            type: "address",
          },
          {
            internalType: "address",
            name: "crvRewards",
            type: "address",
          },
          {
            internalType: "address",
            name: "stash",
            type: "address",
          },
          {
            internalType: "bool",
            name: "shutdown",
            type: "bool",
          },
        ],
        internalType: "struct IBooster.PoolInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class IBooster__factory {
  static readonly abi = _abi;
  static createInterface(): IBoosterInterface {
    return new utils.Interface(_abi) as IBoosterInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IBooster {
    return new Contract(address, _abi, signerOrProvider) as IBooster;
  }
}
