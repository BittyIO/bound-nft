import { task } from "hardhat/config";
import { ZERO_ADDRESS } from "../../helpers/constants";
import { getDeploySigner } from "../../helpers/contracts-getters";
import { BNFTRegistryFactory, ProxyAdminFactory } from "../../types";



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