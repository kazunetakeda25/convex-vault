/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../common";

export declare namespace Vault {
  export type RewardStruct = {
    cvxEarned: PromiseOrValue<BigNumberish>;
    crvEarned: PromiseOrValue<BigNumberish>;
  };

  export type RewardStructOutput = [BigNumber, BigNumber] & {
    cvxEarned: BigNumber;
    crvEarned: BigNumber;
  };

  export type RewardIndexStruct = {
    cvxIndex: PromiseOrValue<BigNumberish>;
    crvIndex: PromiseOrValue<BigNumberish>;
  };

  export type RewardIndexStructOutput = [BigNumber, BigNumber] & {
    cvxIndex: BigNumber;
    crvIndex: BigNumber;
  };
}

export interface VaultInterface extends utils.Interface {
  functions: {
    "BASE_REWARD_POOL()": FunctionFragment;
    "BOOSTER()": FunctionFragment;
    "CRV()": FunctionFragment;
    "CURVE_SWAP()": FunctionFragment;
    "CVX()": FunctionFragment;
    "LP()": FunctionFragment;
    "PID()": FunctionFragment;
    "SWAP_ROUTER()": FunctionFragment;
    "addUnderlyingAsset(address)": FunctionFragment;
    "claim(bool,address)": FunctionFragment;
    "deposit(address,uint256)": FunctionFragment;
    "depositAmountTotal()": FunctionFragment;
    "getVaultReward(address)": FunctionFragment;
    "owner()": FunctionFragment;
    "removeUnderlyingAsset(address)": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "rewardIndex()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "underlyingAssets(address)": FunctionFragment;
    "userInfo(address)": FunctionFragment;
    "withdraw(uint256,bool,address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "BASE_REWARD_POOL"
      | "BOOSTER"
      | "CRV"
      | "CURVE_SWAP"
      | "CVX"
      | "LP"
      | "PID"
      | "SWAP_ROUTER"
      | "addUnderlyingAsset"
      | "claim"
      | "deposit"
      | "depositAmountTotal"
      | "getVaultReward"
      | "owner"
      | "removeUnderlyingAsset"
      | "renounceOwnership"
      | "rewardIndex"
      | "transferOwnership"
      | "underlyingAssets"
      | "userInfo"
      | "withdraw"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "BASE_REWARD_POOL",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "BOOSTER", values?: undefined): string;
  encodeFunctionData(functionFragment: "CRV", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "CURVE_SWAP",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "CVX", values?: undefined): string;
  encodeFunctionData(functionFragment: "LP", values?: undefined): string;
  encodeFunctionData(functionFragment: "PID", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "SWAP_ROUTER",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "addUnderlyingAsset",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "claim",
    values: [PromiseOrValue<boolean>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "deposit",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "depositAmountTotal",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getVaultReward",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "removeUnderlyingAsset",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "rewardIndex",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "underlyingAssets",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "userInfo",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<boolean>,
      PromiseOrValue<string>
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "BASE_REWARD_POOL",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "BOOSTER", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "CRV", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "CURVE_SWAP", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "CVX", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "LP", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "PID", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "SWAP_ROUTER",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "addUnderlyingAsset",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "claim", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "deposit", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "depositAmountTotal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getVaultReward",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "removeUnderlyingAsset",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "rewardIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "underlyingAssets",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "userInfo", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {
    "Claim(address,uint256,uint256)": EventFragment;
    "Deposit(address,address,uint256)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "UnderlyingAssetsAdded(address)": EventFragment;
    "UnderlyingAssetsRemoved(address)": EventFragment;
    "Withdraw(address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Claim"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Deposit"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "UnderlyingAssetsAdded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "UnderlyingAssetsRemoved"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Withdraw"): EventFragment;
}

export interface ClaimEventObject {
  user: string;
  crvReward: BigNumber;
  cvxReward: BigNumber;
}
export type ClaimEvent = TypedEvent<
  [string, BigNumber, BigNumber],
  ClaimEventObject
>;

export type ClaimEventFilter = TypedEventFilter<ClaimEvent>;

export interface DepositEventObject {
  user: string;
  token: string;
  amount: BigNumber;
}
export type DepositEvent = TypedEvent<
  [string, string, BigNumber],
  DepositEventObject
>;

export type DepositEventFilter = TypedEventFilter<DepositEvent>;

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface UnderlyingAssetsAddedEventObject {
  token: string;
}
export type UnderlyingAssetsAddedEvent = TypedEvent<
  [string],
  UnderlyingAssetsAddedEventObject
>;

export type UnderlyingAssetsAddedEventFilter =
  TypedEventFilter<UnderlyingAssetsAddedEvent>;

export interface UnderlyingAssetsRemovedEventObject {
  token: string;
}
export type UnderlyingAssetsRemovedEvent = TypedEvent<
  [string],
  UnderlyingAssetsRemovedEventObject
>;

export type UnderlyingAssetsRemovedEventFilter =
  TypedEventFilter<UnderlyingAssetsRemovedEvent>;

export interface WithdrawEventObject {
  user: string;
  amount: BigNumber;
}
export type WithdrawEvent = TypedEvent<
  [string, BigNumber],
  WithdrawEventObject
>;

export type WithdrawEventFilter = TypedEventFilter<WithdrawEvent>;

export interface Vault extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: VaultInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    BASE_REWARD_POOL(overrides?: CallOverrides): Promise<[string]>;

    BOOSTER(overrides?: CallOverrides): Promise<[string]>;

    CRV(overrides?: CallOverrides): Promise<[string]>;

    CURVE_SWAP(overrides?: CallOverrides): Promise<[string]>;

    CVX(overrides?: CallOverrides): Promise<[string]>;

    LP(overrides?: CallOverrides): Promise<[string]>;

    PID(overrides?: CallOverrides): Promise<[BigNumber]>;

    SWAP_ROUTER(overrides?: CallOverrides): Promise<[string]>;

    addUnderlyingAsset(
      _token: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    claim(
      _swapRewards: PromiseOrValue<boolean>,
      _swapToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    deposit(
      _token: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    depositAmountTotal(overrides?: CallOverrides): Promise<[BigNumber]>;

    getVaultReward(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { crvReward: BigNumber; cvxReward: BigNumber }
    >;

    owner(overrides?: CallOverrides): Promise<[string]>;

    removeUnderlyingAsset(
      _token: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    rewardIndex(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { cvxIndex: BigNumber; crvIndex: BigNumber }
    >;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    underlyingAssets(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    userInfo(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, Vault.RewardStructOutput, Vault.RewardIndexStructOutput] & {
        amount: BigNumber;
        reward: Vault.RewardStructOutput;
        rewardIndex: Vault.RewardIndexStructOutput;
      }
    >;

    withdraw(
      _amount: PromiseOrValue<BigNumberish>,
      _swapRewards: PromiseOrValue<boolean>,
      _swapToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  BASE_REWARD_POOL(overrides?: CallOverrides): Promise<string>;

  BOOSTER(overrides?: CallOverrides): Promise<string>;

  CRV(overrides?: CallOverrides): Promise<string>;

  CURVE_SWAP(overrides?: CallOverrides): Promise<string>;

  CVX(overrides?: CallOverrides): Promise<string>;

  LP(overrides?: CallOverrides): Promise<string>;

  PID(overrides?: CallOverrides): Promise<BigNumber>;

  SWAP_ROUTER(overrides?: CallOverrides): Promise<string>;

  addUnderlyingAsset(
    _token: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  claim(
    _swapRewards: PromiseOrValue<boolean>,
    _swapToken: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  deposit(
    _token: PromiseOrValue<string>,
    _amount: PromiseOrValue<BigNumberish>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  depositAmountTotal(overrides?: CallOverrides): Promise<BigNumber>;

  getVaultReward(
    _user: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber] & { crvReward: BigNumber; cvxReward: BigNumber }
  >;

  owner(overrides?: CallOverrides): Promise<string>;

  removeUnderlyingAsset(
    _token: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  renounceOwnership(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  rewardIndex(
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber] & { cvxIndex: BigNumber; crvIndex: BigNumber }
  >;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  underlyingAssets(
    arg0: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  userInfo(
    arg0: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, Vault.RewardStructOutput, Vault.RewardIndexStructOutput] & {
      amount: BigNumber;
      reward: Vault.RewardStructOutput;
      rewardIndex: Vault.RewardIndexStructOutput;
    }
  >;

  withdraw(
    _amount: PromiseOrValue<BigNumberish>,
    _swapRewards: PromiseOrValue<boolean>,
    _swapToken: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    BASE_REWARD_POOL(overrides?: CallOverrides): Promise<string>;

    BOOSTER(overrides?: CallOverrides): Promise<string>;

    CRV(overrides?: CallOverrides): Promise<string>;

    CURVE_SWAP(overrides?: CallOverrides): Promise<string>;

    CVX(overrides?: CallOverrides): Promise<string>;

    LP(overrides?: CallOverrides): Promise<string>;

    PID(overrides?: CallOverrides): Promise<BigNumber>;

    SWAP_ROUTER(overrides?: CallOverrides): Promise<string>;

    addUnderlyingAsset(
      _token: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    claim(
      _swapRewards: PromiseOrValue<boolean>,
      _swapToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    deposit(
      _token: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    depositAmountTotal(overrides?: CallOverrides): Promise<BigNumber>;

    getVaultReward(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { crvReward: BigNumber; cvxReward: BigNumber }
    >;

    owner(overrides?: CallOverrides): Promise<string>;

    removeUnderlyingAsset(
      _token: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    rewardIndex(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { cvxIndex: BigNumber; crvIndex: BigNumber }
    >;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    underlyingAssets(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    userInfo(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, Vault.RewardStructOutput, Vault.RewardIndexStructOutput] & {
        amount: BigNumber;
        reward: Vault.RewardStructOutput;
        rewardIndex: Vault.RewardIndexStructOutput;
      }
    >;

    withdraw(
      _amount: PromiseOrValue<BigNumberish>,
      _swapRewards: PromiseOrValue<boolean>,
      _swapToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "Claim(address,uint256,uint256)"(
      user?: PromiseOrValue<string> | null,
      crvReward?: null,
      cvxReward?: null
    ): ClaimEventFilter;
    Claim(
      user?: PromiseOrValue<string> | null,
      crvReward?: null,
      cvxReward?: null
    ): ClaimEventFilter;

    "Deposit(address,address,uint256)"(
      user?: PromiseOrValue<string> | null,
      token?: PromiseOrValue<string> | null,
      amount?: null
    ): DepositEventFilter;
    Deposit(
      user?: PromiseOrValue<string> | null,
      token?: PromiseOrValue<string> | null,
      amount?: null
    ): DepositEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;

    "UnderlyingAssetsAdded(address)"(
      token?: PromiseOrValue<string> | null
    ): UnderlyingAssetsAddedEventFilter;
    UnderlyingAssetsAdded(
      token?: PromiseOrValue<string> | null
    ): UnderlyingAssetsAddedEventFilter;

    "UnderlyingAssetsRemoved(address)"(
      token?: PromiseOrValue<string> | null
    ): UnderlyingAssetsRemovedEventFilter;
    UnderlyingAssetsRemoved(
      token?: PromiseOrValue<string> | null
    ): UnderlyingAssetsRemovedEventFilter;

    "Withdraw(address,uint256)"(
      user?: PromiseOrValue<string> | null,
      amount?: null
    ): WithdrawEventFilter;
    Withdraw(
      user?: PromiseOrValue<string> | null,
      amount?: null
    ): WithdrawEventFilter;
  };

  estimateGas: {
    BASE_REWARD_POOL(overrides?: CallOverrides): Promise<BigNumber>;

    BOOSTER(overrides?: CallOverrides): Promise<BigNumber>;

    CRV(overrides?: CallOverrides): Promise<BigNumber>;

    CURVE_SWAP(overrides?: CallOverrides): Promise<BigNumber>;

    CVX(overrides?: CallOverrides): Promise<BigNumber>;

    LP(overrides?: CallOverrides): Promise<BigNumber>;

    PID(overrides?: CallOverrides): Promise<BigNumber>;

    SWAP_ROUTER(overrides?: CallOverrides): Promise<BigNumber>;

    addUnderlyingAsset(
      _token: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    claim(
      _swapRewards: PromiseOrValue<boolean>,
      _swapToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    deposit(
      _token: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    depositAmountTotal(overrides?: CallOverrides): Promise<BigNumber>;

    getVaultReward(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    removeUnderlyingAsset(
      _token: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    rewardIndex(overrides?: CallOverrides): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    underlyingAssets(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    userInfo(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    withdraw(
      _amount: PromiseOrValue<BigNumberish>,
      _swapRewards: PromiseOrValue<boolean>,
      _swapToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    BASE_REWARD_POOL(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    BOOSTER(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    CRV(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    CURVE_SWAP(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    CVX(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    LP(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    PID(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    SWAP_ROUTER(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    addUnderlyingAsset(
      _token: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    claim(
      _swapRewards: PromiseOrValue<boolean>,
      _swapToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    deposit(
      _token: PromiseOrValue<string>,
      _amount: PromiseOrValue<BigNumberish>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    depositAmountTotal(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getVaultReward(
      _user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    removeUnderlyingAsset(
      _token: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    rewardIndex(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    underlyingAssets(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    userInfo(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    withdraw(
      _amount: PromiseOrValue<BigNumberish>,
      _swapRewards: PromiseOrValue<boolean>,
      _swapToken: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
