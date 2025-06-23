import { BytesLike } from "ethers";
import { task } from "hardhat/config";
import {
  deployBNFTProxyAdmin,
  deployBNFTRegistry,
  deployCryptoPunksMarket,
  deployGenericBNFTImpl,
  deployMintableERC721,
  deployWrappedPunk
} from "../../helpers/contracts-deployments";
import {
  getBNFT,
  getBNFTProxyAdminById,
  getBNFTRegistryProxy,
  getCryptoPunksMarket,
  getDeploySigner,
  getPoolOwnerSigner
} from "../../helpers/contracts-getters";
import { registerContractInJsonDb } from "../../helpers/contracts-helpers";
import { verifyEtherscanContract } from "../../helpers/etherscan-verification";
import { DRE, getDb, notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eContractid, eNetwork, tEthereumAddress } from "../../helpers/types";
import {
  BNFTRegistry,
  BNFTUpgradeableProxyFactory
} from "../../types";
// @ts-ignore
import retry from "async-retry";
import { BNFTConfigs, NftAssets } from "./config";


task("deploy:deploy-all", "Deploy all contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, { run }) => {
    await run("set-DRE");
    await run("compile");
    await run("deploy:deploy-proxy-admin", { verify });
    await run("deploy:deploy-bnft-registry", { verify });
    await run("deploy:deploy-bnft-tokens", { verify });

  });

task("deploy:deploy-proxy-admin", "Deploy proxy admin contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, DRE) => {
    await DRE.run("set-DRE");
    await DRE.run("compile");
    await deployBNFTProxyAdmin(eContractid.ProxyAdmin, verify);
  });


task("deploy:deploy-bnft-registry", "Deploy bnft registry")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run("set-DRE");
    await localBRE.run("compile");

    const proxyAdmin = await getBNFTProxyAdminById(eContractid.ProxyAdmin);

    const bnftGenericImpl = await deployGenericBNFTImpl(verify);
    const bnftRegistryImpl = await deployBNFTRegistry(verify);

    console.log('bnftGenericImpl', bnftGenericImpl.address);
    console.log('bnftRegistryImpl', bnftRegistryImpl.address);
    const bnftConfigs = BNFTConfigs[DRE.network.name];

    const initEncodedData = bnftRegistryImpl.interface.encodeFunctionData("initialize", [
      bnftGenericImpl.address,
      bnftConfigs.BNftNamePrefix,
      bnftConfigs.BNftSymbolPrefix,
    ]);

    await deployBNFTUpgradeableProxy(proxyAdmin.address, bnftRegistryImpl.address, initEncodedData, verify);
  });

task("deploy:deploy-new-bnft-impl", "Deploy new bnft implementation")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run("set-DRE");
    await localBRE.run("compile");
    await deployGenericBNFTImpl(verify);
  });

task("deploy:bnft-registry-set-impl", "Set bnft registry implementation")
  .setAction(async ({ }, localBRE) => {
    await localBRE.run("set-DRE");
    await localBRE.run("compile");
    const bnftRegistryProxy: BNFTRegistry = await getBNFTRegistryProxy();
    await bnftRegistryProxy.setBNFTGenericImpl(getContractAddressFromDB('BNFT'));
  });

task("deploy:bnft-registry-upgrade-all", "Upgrade all bnft registry")
  .setAction(async ({ }, localBRE) => {
    await localBRE.run("set-DRE");
    await localBRE.run("compile");
    const bnftRegistryProxy: BNFTRegistry = await getBNFTRegistryProxy();
    const tx = await bnftRegistryProxy.batchUpgradeAllBNFT({ gasLimit: 10000000 });
    await waitForTx(tx);
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

task("deploy:punk-transferOwnership", "")
  .setAction(async ({ }, DRE) => {
    await DRE.run("set-DRE");
    await DRE.run("compile");
    const cryptoPunksMarket = await getCryptoPunksMarket();
    await cryptoPunksMarket.transferOwnership('0x7405172094eC22d313e2D239Feb8aE69be030bd1');
  });

task("deploy:deploy-bnft-tokens", "Deploy bnft tokens for full enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ }, DRE) => {
    await DRE.run("set-DRE");
    await DRE.run("compile");

    const network = <eNetwork>DRE.network.name;
    const ownerSigner = await getPoolOwnerSigner();

    const bnftRegistryProxy: BNFTRegistry = await getBNFTRegistryProxy();
    let bnftGenericImplAddress = await retry(async () => await bnftRegistryProxy.bNftGenericImpl());
    const bnftGenericImpl = await getBNFT(bnftGenericImplAddress);
    const nftsAssets = NftAssets[DRE.network.name];
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

task("deploy:deploy-mock-nfts", "Deploy mock nfts for dev enviroment")
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
task("deploy:deploy-mock-cryptoPunks", "Deploy mock CryptoPunks")
  .addFlag("verify", "Verify contracts at Etherscan")
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run("set-DRE");
    await localBRE.run("compile");

    const cryptoPunksMarket = await deployCryptoPunksMarket([], verify);
    const wrappedPunk = await deployWrappedPunk([cryptoPunksMarket.address], verify);
    await registerContractInJsonDb("cryptoPunksMarket", cryptoPunksMarket);
    await registerContractInJsonDb("wrappedPunk", wrappedPunk);
  });

export const getContractAddressFromDB = (id: string) => getDb(DRE.network.name).get(id).value().address;


task("deploy:transferOwnership", "Transfer ownership of proxy admin to new address")
  .addParam("newOwner", "New owner address")
  .setAction(async ({ newOwner }, DRE) => {
    await DRE.run("set-DRE");
    await DRE.run("compile");

    const bnftRegistryProxy: BNFTRegistry = await getBNFTRegistryProxy();
    await bnftRegistryProxy.setClaimAdmin(newOwner);
    await bnftRegistryProxy.transferOwnership(newOwner);

    const boundWPUNKS = await getBNFT(getContractAddressFromDB('boundWPUNKS'));
    await boundWPUNKS.setClaimAdmin(newOwner);
    await boundWPUNKS.transferOwnership(newOwner);
    console.log('boundWPUNKS done');
    const boundBAYC = await getBNFT(getContractAddressFromDB('boundBAYC'));
    await boundBAYC.setClaimAdmin(newOwner);
    await boundBAYC.transferOwnership(newOwner);
    console.log('boundBAYC done');
    const boundMAYC = await getBNFT(getContractAddressFromDB('boundMAYC'));
    await boundMAYC.setClaimAdmin(newOwner);
    await boundMAYC.transferOwnership(newOwner);
    console.log('boundMAYC done');
    const boundAZUKI = await getBNFT(getContractAddressFromDB('boundAZUKI'));
    await boundAZUKI.setClaimAdmin(newOwner);
    await boundAZUKI.transferOwnership(newOwner);
    console.log('boundAZUKI done');
    const boundMEEBITS = await getBNFT(getContractAddressFromDB('boundMEEBITS'));
    await boundMEEBITS.setClaimAdmin(newOwner);
    await boundMEEBITS.transferOwnership(newOwner);
    console.log('boundMEEBITS done');
    const boundMIL = await getBNFT(getContractAddressFromDB('boundMIL'));
    await boundMIL.setClaimAdmin(newOwner);
    await boundMIL.transferOwnership(newOwner);
    console.log('boundMIL done');
    const boundPUDGY = await getBNFT(getContractAddressFromDB('boundPUDGY'));
    await boundPUDGY.setClaimAdmin(newOwner);
    await boundPUDGY.transferOwnership(newOwner);
    console.log('boundPUDGY done');
    const boundMFER = await getBNFT(getContractAddressFromDB('boundMFER'));
    await boundMFER.setClaimAdmin(newOwner);
    await boundMFER.transferOwnership(newOwner);
    console.log('boundMFER done');
    const boundLILP = await getBNFT(getContractAddressFromDB('boundLILP'));
    await boundLILP.setClaimAdmin(newOwner);
    await boundLILP.transferOwnership(newOwner);
    console.log('boundLILP done');
  });