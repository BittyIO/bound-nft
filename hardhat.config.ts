import fs from "fs";
import { HardhatUserConfig } from "hardhat/types";
import path from "path";
// @ts-ignore
import { buildForkConfig, NETWORKS_DEFAULT_GAS, NETWORKS_RPC_URL } from "./helper-hardhat-config";
import { BUIDLEREVM_CHAINID, COVERAGE_CHAINID } from "./helpers/buidler-constants";
import { eEthereumNetwork, eNetwork } from "./helpers/types";
import { accounts } from "./test-wallets.js";

require("dotenv").config();

import "@nomicfoundation/hardhat-verify";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-solhint";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
require("hardhat-storage-layout-diff");
import "hardhat-abi-exporter";

const SKIP_LOAD = process.env.SKIP_LOAD === "true";
const DEFAULT_BLOCK_GAS_LIMIT = 12450000;
const DEFAULT_GAS_MUL = 5;
const HARDFORK = "istanbul";
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || "";
const MNEMONIC_PATH = "m/44'/60'/0'/0";
const MNEMONIC = process.env.MNEMONIC || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const UNLIMITED_BYTECODE_SIZE = process.env.UNLIMITED_BYTECODE_SIZE === "true";

// Prevent to load scripts before compilation and typechain
if (!SKIP_LOAD) {
  ["misc", "deploy", "dev", "full", "verifications", "helpers"].forEach((folder) => {
    const tasksPath = path.join(__dirname, "tasks", folder);
    fs.readdirSync(tasksPath)
      .filter((pth) => pth.includes(".ts"))
      .forEach((task) => {
        require(`${tasksPath}/${task}`);
      });
  });
}

require(`${path.join(__dirname, "tasks/misc")}/set-bre.ts`);

const getCommonNetworkConfig = (networkName: eNetwork, networkId: number) => ({
  url: NETWORKS_RPC_URL[networkName],
  hardfork: HARDFORK,
  blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
  gasMultiplier: DEFAULT_GAS_MUL,
  //gasPrice: NETWORKS_DEFAULT_GAS[networkName],
  chainId: networkId,
  accounts: PRIVATE_KEY
    ? [PRIVATE_KEY]
    : {
      mnemonic: MNEMONIC,
      path: MNEMONIC_PATH,
      initialIndex: 0,
      count: 20,
    },
});

const buidlerConfig: HardhatUserConfig = {
  abiExporter: {
    path: "./abis",
    runOnCompile: true,
    clear: true,
    flat: true,
    pretty: false,
    except: ["test*", "@openzeppelin*", "Mock*", "Test*", "mock*"],
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "istanbul",
        },
      },
      {
        version: "0.4.11",
      },
      {
        version: "0.8.20",
      },
      {
        version: "0.5.11",
        settings: {
          evmVersion: "petersburg",
        },
      },
    ],
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
  mocha: {
    timeout: 0,
  },
  networks: {
    coverage: {
      url: "http://localhost:8555",
      chainId: COVERAGE_CHAINID,
    },
    localhost: {
      url: "http://localhost:8545",
      chainId: BUIDLEREVM_CHAINID,
      accounts: accounts.map(({ secretKey, balance }: { secretKey: string; balance: string }) => secretKey),
    },
    sepolia: getCommonNetworkConfig(eEthereumNetwork.sepolia, 11155111),
    main: getCommonNetworkConfig(eEthereumNetwork.main, 1),
    hardhat: {
      hardfork: "berlin",
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      gasPrice: NETWORKS_DEFAULT_GAS[eEthereumNetwork.hardhat],
      allowUnlimitedContractSize: UNLIMITED_BYTECODE_SIZE,
      chainId: BUIDLEREVM_CHAINID,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      accounts: accounts.map(({ secretKey, balance }: { secretKey: string; balance: string }) => ({
        privateKey: secretKey,
        balance: balance,
      })),
      forking: buildForkConfig(),
    },
    ganache: {
      url: "http://ganache:8545",
      accounts: {
        mnemonic: "fox sight canyon orphan hotel grow hedgehog build bless august weather swarm",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
  },
};

export default buidlerConfig;
