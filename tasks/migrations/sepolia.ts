import { BytesLike } from "ethers";
import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { deployAllMockNfts, deployBNFTProxyAdmin, deployBNFTRegistry, deployCryptoPunksMarket, deployGenericBNFTImpl, deployMintableERC721, deployWrappedPunk } from "../../helpers/contracts-deployments";
import {
  getBNFT,
  getBNFTProxyAdminById,
  getBNFTRegistryImpl,
  getBNFTRegistryProxy,
  getCryptoPunksMarket,
  getDeploySigner,
  getPoolOwnerSigner,
} from "../../helpers/contracts-getters";
import { getParamPerNetwork, registerContractInJsonDb } from "../../helpers/contracts-helpers";
import { verifyEtherscanContract } from "../../helpers/etherscan-verification";
import { DRE, getDb, notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork, tEthereumAddress } from "../../helpers/types";
import {
  BNFTRegistry,
  BNFTUpgradeableProxyFactory
} from "../../types";
// @ts-ignore
import retry from "async-retry";


task("sepolia:deploy-mock-nfts", "Deploy mock nfts for dev enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run("set-DRE");
    await localBRE.run("compile");
    for (const tokenSymbol of ["MIL", "MBIT", "PUDGY", "LILP", "ELEM", "BEANZ", "MFER", "DOODLE", "COOL", "NKMGS", "Rektguy"]) {
      const tokenName = "BendDAO Mock " + tokenSymbol;
      const token = await deployMintableERC721([tokenName, tokenSymbol], verify);
      await registerContractInJsonDb(tokenSymbol.toUpperCase(), token);
    }
  });

task("sepolia:deploy-proxy-admin", "Deploy proxy admin contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");
    await DRE.run("compile");
    await deployBNFTProxyAdmin(eContractid.ProxyAdmin, verify);
  });

task("sepolia:deploy-mock-cryptoPunks", "Deploy mock CryptoPunks")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run("set-DRE");
    await localBRE.run("compile");

    const cryptoPunksMarket = await deployCryptoPunksMarket([], verify);
    const wrappedPunk = await deployWrappedPunk([cryptoPunksMarket.address], verify);
    await registerContractInJsonDb("cryptoPunksMarket", cryptoPunksMarket);
    await registerContractInJsonDb("wrappedPunk", wrappedPunk);
  });

task("sepolia:deploy-bnft-registry", "Deploy bnft registry")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run("set-DRE");
    await localBRE.run("compile");

    const proxyAdmin = await getBNFTProxyAdminById(eContractid.ProxyAdmin);

    const poolConfig = loadPoolConfig(ConfigNames.Bend);

    const bnftGenericImpl = await deployGenericBNFTImpl(verify);
    const bnftRegistryImpl = await deployBNFTRegistry(verify);

    console.log(bnftGenericImpl.address);
    console.log(bnftRegistryImpl.address);

    const initEncodedData = bnftRegistryImpl.interface.encodeFunctionData("initialize", [
      bnftGenericImpl.address,
      poolConfig.BNftNamePrefix,
      poolConfig.BNftSymbolPrefix,
    ]);

    await deployBNFTUpgradeableProxy(proxyAdmin.address, bnftRegistryImpl.address, initEncodedData, verify);
  });

export const deployBNFTUpgradeableProxy = async (
  admin: tEthereumAddress,
  logic: tEthereumAddress,
  data: BytesLike,
  verify?: boolean
) => {
  const instance = await new BNFTUpgradeableProxyFactory(await getDeploySigner()).deploy(logic, admin, data);
  await waitForTx(instance.deployTransaction);
  await registerContractInJsonDb(eContractid.BNFTRegistry, instance);
  if (verify) {
    await verifyEtherscanContract(
      instance.address,
      [logic, admin, DRE.ethers.utils.hexlify(data)],
      "contracts/libraries/BNFTUpgradeableProxy.sol:BNFTUpgradeableProxy"
    );
  }
};

task("sepolia:punk-transferOwnership", "")
  .setAction(async ({}, DRE) => {
    await DRE.run("set-DRE");
    await DRE.run("compile");
    const cryptoPunksMarket = await getCryptoPunksMarket();
    await cryptoPunksMarket.transferOwnership('0x7405172094eC22d313e2D239Feb8aE69be030bd1');
  });

task("sepolia:deploy-bnft-tokens", "Deploy bnft tokens for full enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({}, DRE) => {
    await DRE.run("set-DRE");
    await DRE.run("compile");

    const network = <eNetwork>DRE.network.name;
    const ownerSigner = await getPoolOwnerSigner();

    const poolConfig = loadPoolConfig(ConfigNames.Bend);

    const bnftRegistryProxy: BNFTRegistry = await getBNFTRegistryProxy();
    let bnftGenericImplAddress = await retry(async () => await bnftRegistryProxy.bNftGenericImpl());
    const bnftGenericImpl = await getBNFT(bnftGenericImplAddress);
    const nftsAssets = getParamPerNetwork(poolConfig.NftsAssets, network);
    for (const [assetSymbol, assetAddress] of Object.entries(nftsAssets) as [string, string][]) {
      let bnftAddresses = await retry(async () => await bnftRegistryProxy.getBNFTAddresses(assetAddress));
      if (bnftAddresses.bNftProxy == undefined || !notFalsyOrZeroAddress(bnftAddresses.bNftProxy)) {
        console.log("Deploying new BNFT implementation for %s...", assetSymbol);
        await waitForTx(await bnftRegistryProxy.createBNFT(assetAddress));
        console.log("Deploy done");
      } else if (bnftGenericImpl.address !== bnftAddresses.bNftImpl) {
        console.log("Upgrading exist BNFT implementation for %s", assetSymbol);

        await waitForTx(
          await bnftRegistryProxy.connect(ownerSigner).upgradeBNFTWithImpl(assetAddress, bnftGenericImpl.address, [])
        );
        console.log("Upgrade done");
      }
      bnftAddresses = await retry(async () => await bnftRegistryProxy.getBNFTAddresses(assetAddress));

      const bnftProxy = await getBNFT(bnftAddresses.bNftProxy);
      console.log(
        "BNFT: name: %s, symbol: %s, proxy.address: %s, implementation.address: %s",
        await retry(async () => bnftProxy.name()),
        await retry(async () => bnftProxy.symbol()),
        bnftAddresses.bNftProxy,
        bnftAddresses.bNftImpl
      );
      getDb(network)
        .set(`bound${assetSymbol}`, {
          address: bnftProxy.address,
        })
        .write();
    }
  });

task("verify:Contract", "verify contract")
  .addParam("address", "The contract address")
  .addOptionalParam("contract", "The contract file path")
  .addOptionalParam("args", "The contract constructor args")
  .setAction(async ({ address, args, contract }, { run }) => {
    await run("set-DRE");
    await run("compile");
    if (args) {
      args = (args as string).split(",");
    } else {
      args = [];
    }

    await verifyEtherscanContract(address, args, contract);
  });

task("verify:All", "verify all contract").setAction(async ({}, { run }) => {
  await run("set-DRE");
  await run("compile");
  const deployer = await getDeploySigner();

  // await verifyEtherscanContract(getContractAddressFromDB("BITCOINFORGS"), [
  //   "BendDAO Mock BITCOINFORGS",
  //   "BITCOINFORGS",
  //   "https://layer-api.merlinchain.io/meta/nft/",
  // ]);
  // await verifyEtherscanContract(getContractAddressFromDB("NODEMONKES"), [
  //   "BendDAO Mock NODEMONKES",
  //   "NODEMONKES",
  //   "https://layer-api.merlinchain.io/meta/nft/",
  // ]);
  // await verifyEtherscanContract(getContractAddressFromDB("BITCOINPUPPETS"), [
  //   "BendDAO Mock BITCOINPUPPETS",
  //   "BITCOINPUPPETS",
  //   "https://layer-api.merlinchain.io/meta/nft/",
  // ]);
  // await verifyEtherscanContract(getContractAddressFromDB("QUANTUMCATS"), [
  //   "BendDAO Mock QUANTUMCATS",
  //   "QUANTUMCATS",
  //   "https://layer-api.merlinchain.io/meta/nft/",
  // ]);

  await verifyEtherscanContract(
    getContractAddressFromDB("ProxyAdmin"),
    [],
    "contracts/libraries/BNFTProxyAdmin.sol:BNFTProxyAdmin"
  );

  // await verifyEtherscanContract(
  //   getContractAddressFromDB("ProxyAdminWithoutTimelock"),
  //   [],
  //   "contracts/libraries/BNFTProxyAdmin.sol:BNFTProxyAdmin"
  // );

  await verifyEtherscanContract(getContractAddressFromDB("BNFT"), []);
  await verifyEtherscanContract(getContractAddressFromDB("BNFTRegistryImpl"), []);

  let bnftRegistryImpl = await getDb(DRE.network.name).get(`${eContractid.BNFTRegistryImpl}`).value();
  bnftRegistryImpl = await getBNFTRegistryImpl(bnftRegistryImpl.address);
  let bnftGenericImpl = await getDb(DRE.network.name).get(`${eContractid.BNFT}`).value();

  const poolConfig = loadPoolConfig(ConfigNames.Bend);

  bnftGenericImpl = await getBNFT(bnftGenericImpl.address);
  const bnftRegistryProxy: BNFTRegistry = await getBNFTRegistryProxy();
  const initEncodedData = bnftRegistryImpl.interface.encodeFunctionData("initialize", [
    bnftGenericImpl.address,
    poolConfig.BNftNamePrefix,
    poolConfig.BNftSymbolPrefix,
  ]);
  const admin = await getBNFTProxyAdminById(eContractid.ProxyAdmin);
  await verifyEtherscanContract(
    getContractAddressFromDB("BNFTRegistry"),
    [bnftRegistryImpl.address, admin, initEncodedData],
    "contracts/libraries/BNFTUpgradeableProxy.sol:BNFTUpgradeableProxy"
  );

  await verifyEtherscanContract(
    getContractAddressFromDB("boundBITCOINFORGS"),
    [
      bnftGenericImpl.address,
      bnftRegistryProxy.address,
      bnftGenericImpl.interface.encodeFunctionData("initialize", [
        // getContractAddressFromDB("BITCOINFORGS"),
        // `${poolConfig.BNftNamePrefix} BITCOINFORGS`,
        // `${poolConfig.BNftSymbolPrefix}BITCOINFORGS`,
        getParamPerNetwork(poolConfig.NftsAssets, <eNetwork>DRE.network.name)["BITCOINFORGS"],
        `${poolConfig.BNftNamePrefix} Merlin's Seal Bitcoin Puppets`,
        `${poolConfig.BNftSymbolPrefix}M-bitcoin-puppets`,
        await deployer.getAddress(),
        await deployer.getAddress(),
        bnftRegistryProxy.address,
      ]),
    ],
    "contracts/libraries/BNFTUpgradeableProxy.sol:BNFTUpgradeableProxy"
  );
  await verifyEtherscanContract(
    getContractAddressFromDB("boundNODEMONKES"),
    [
      bnftGenericImpl.address,
      bnftRegistryProxy.address,
      bnftGenericImpl.interface.encodeFunctionData("initialize", [
        // getContractAddressFromDB("NODEMONKES"),
        // `${poolConfig.BNftNamePrefix} NODEMONKES`,
        // `${poolConfig.BNftSymbolPrefix}NODEMONKES`,
        getParamPerNetwork(poolConfig.NftsAssets, <eNetwork>DRE.network.name)["NODEMONKES"],
        `${poolConfig.BNftNamePrefix} Merlin's Seal NodeMonkes`,
        `${poolConfig.BNftSymbolPrefix}M-nodemonkes`,
        await deployer.getAddress(),
        await deployer.getAddress(),
        bnftRegistryProxy.address,
      ]),
    ],
    "contracts/libraries/BNFTUpgradeableProxy.sol:BNFTUpgradeableProxy"
  );
  await verifyEtherscanContract(
    getContractAddressFromDB("boundBITCOINPUPPETS"),
    [
      bnftGenericImpl.address,
      bnftRegistryProxy.address,
      bnftGenericImpl.interface.encodeFunctionData("initialize", [
        // getContractAddressFromDB("BITCOINPUPPETS"),
        // `${poolConfig.BNftNamePrefix} BITCOINPUPPETS`,
        // `${poolConfig.BNftSymbolPrefix}BITCOINPUPPETS`,
        getParamPerNetwork(poolConfig.NftsAssets, <eNetwork>DRE.network.name)["BITCOINPUPPETS"],
        `${poolConfig.BNftNamePrefix} Merlin's Seal Bitcoin Puppets`,
        `${poolConfig.BNftSymbolPrefix}M-bitcoin-puppets`,
        await deployer.getAddress(),
        await deployer.getAddress(),
        bnftRegistryProxy.address,
      ]),
    ],
    "contracts/libraries/BNFTUpgradeableProxy.sol:BNFTUpgradeableProxy"
  );
  await verifyEtherscanContract(
    getContractAddressFromDB("boundQUANTUMCATS"),
    [
      bnftGenericImpl.address,
      bnftRegistryProxy.address,
      bnftGenericImpl.interface.encodeFunctionData("initialize", [
        // getContractAddressFromDB("QUANTUMCATS"),
        // `${poolConfig.BNftNamePrefix} QUANTUMCATS`,
        // `${poolConfig.BNftSymbolPrefix}QUANTUMCATS`,
        getParamPerNetwork(poolConfig.NftsAssets, <eNetwork>DRE.network.name)["QUANTUMCATS"],
        `${poolConfig.BNftNamePrefix} Merlin's Seal Quantum Cats`,
        `${poolConfig.BNftSymbolPrefix}M-Quantum Cats`,
        await deployer.getAddress(),
        await deployer.getAddress(),
        bnftRegistryProxy.address,
      ]),
    ],
    "contracts/libraries/BNFTUpgradeableProxy.sol:BNFTUpgradeableProxy"
  );
});

export const getContractAddressFromDB = (id: string) => getDb(DRE.network.name).get(id).value().address;
