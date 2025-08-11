import { task } from "hardhat/config";
import { ZERO_ADDRESS } from "../../helpers/constants";
import { getDeploySigner } from "../../helpers/contracts-getters";
import { BNFTRegistryFactory, ProxyAdminFactory } from "../../types";
import { Network, NftAssets } from "./config";



task("abi:proxyAdmin:upgrade", "Proxy admin contract")
  .addParam("proxy", "Proxy address")
  .addParam("implementation", "Implementation address")
  .setAction(async ({ proxy, implementation }, { run }) => {
    await run("set-DRE");
    await run("compile");
    const data = ProxyAdminFactory.connect(
      ZERO_ADDRESS,
      await getDeploySigner()
    ).interface.encodeFunctionData("upgrade", [proxy, implementation]);
    console.log(data);
  });


task("abi:BNFTRegistry:setBNFTGenericImpl", "Proxy admin contract")
  .addParam("implementation", "Implementation address")
  .setAction(async ({ implementation }, { run }) => {
    await run("set-DRE");
    await run("compile");
    const data = BNFTRegistryFactory.connect(
      ZERO_ADDRESS,
      await getDeploySigner()
    ).interface.encodeFunctionData("setBNFTGenericImpl", [implementation]);
    console.log(data);
  });


task("abi:BNFTRegistry:batchUpgradeAllBNFT", "Batch upgrade all BNFTs")
  .setAction(async (_, { run }) => {
    await run("set-DRE");
    await run("compile");
    const data = BNFTRegistryFactory.connect(
      ZERO_ADDRESS,
      await getDeploySigner()
    ).interface.encodeFunctionData("batchUpgradeAllBNFT");
    console.log(data);
  });


task("abi:BNFTRegistry:createBNFT", "")
  .setAction(async ({ }, { run }) => {
    await run("set-DRE");
    await run("compile");
    const moonbirds = NftAssets[Network.main].MOONBIRD;
    const mooncats = NftAssets[Network.main].MOONCATS;
    const doodle = NftAssets[Network.main].DOODLE;
    let data = BNFTRegistryFactory.connect(
      ZERO_ADDRESS,
      await getDeploySigner()
    ).interface.encodeFunctionData("createBNFT", [moonbirds]);
    console.log('create moonbirds', data);
    data = BNFTRegistryFactory.connect(
      ZERO_ADDRESS,
      await getDeploySigner()
    ).interface.encodeFunctionData("createBNFT", [mooncats]);
    console.log('create mooncats', data);
    data = BNFTRegistryFactory.connect(
      ZERO_ADDRESS,
      await getDeploySigner()
    ).interface.encodeFunctionData("createBNFT", [doodle]);
    console.log('create doodle', data);
  });