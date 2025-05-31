// @ts-ignore
import { HardhatNetworkForkingUserConfig, HardhatUserConfig } from "hardhat/types";
import { eEthereumNetwork, iParamsPerNetwork } from "./helpers/types";

require("dotenv").config();

const INFURA_KEY = process.env.INFURA_KEY || "";
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || "";
const TENDERLY_FORK_ID = process.env.TENDERLY_FORK_ID || "";
const FORK = process.env.FORK || "";
const FORK_BLOCK_NUMBER = process.env.FORK_BLOCK_NUMBER ? parseInt(process.env.FORK_BLOCK_NUMBER) : 0;

const GWEI = 1000 * 1000 * 1000;

export const buildForkConfig = (): HardhatNetworkForkingUserConfig | undefined => {
  let forkMode;
  if (FORK) {
    forkMode = {
      url: NETWORKS_RPC_URL[FORK],
    };
    if (FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK]) {
      forkMode.blockNumber = FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK];
    }
  }
  return forkMode;
};

export const NETWORKS_RPC_URL: iParamsPerNetwork<string> = {
  [eEthereumNetwork.goerli]: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eEthereumNetwork.rinkeby]: `https://eth-rinkeby.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eEthereumNetwork.main]: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eEthereumNetwork.coverage]: "http://localhost:8555",
  [eEthereumNetwork.hardhat]: "http://localhost:8545",
  [eEthereumNetwork.localhost]: "http://localhost:8545",
  [eEthereumNetwork.sepolia]: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
};

export const NETWORKS_DEFAULT_GAS: iParamsPerNetwork<number> = {
  [eEthereumNetwork.goerli]: 35 * GWEI,
  [eEthereumNetwork.rinkeby]: 35 * GWEI,
  [eEthereumNetwork.main]: 35 * GWEI,
  [eEthereumNetwork.coverage]: 35 * GWEI,
  [eEthereumNetwork.hardhat]: 35 * GWEI,
  [eEthereumNetwork.localhost]: 35 * GWEI,
  [eEthereumNetwork.sepolia]: 35 * GWEI,
};

export const BLOCK_TO_FORK: iParamsPerNetwork<number | undefined> = {
  [eEthereumNetwork.main]: 13623705,
  [eEthereumNetwork.rinkeby]: 0,
  [eEthereumNetwork.goerli]: 0,
  [eEthereumNetwork.coverage]: 0,
  [eEthereumNetwork.hardhat]: 0,
  [eEthereumNetwork.localhost]: 0,
  [eEthereumNetwork.sepolia]: 0,
};
