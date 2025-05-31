import { ICommonConfiguration, eEthereumNetwork } from "../helpers/types";

// ----------------
// PROTOCOL GLOBAL PARAMS
// ----------------

export const CommonsConfig: ICommonConfiguration = {
  BNftNamePrefix: "Bound NFT",
  BNftSymbolPrefix: "bound",

  ProtocolGlobalParams: {
    NilAddress: "0x0000000000000000000000000000000000000000",
    OneAddress: "0x0000000000000000000000000000000000000001",
  },

  // ----------------
  // COMMON PROTOCOL ADDRESSES ACROSS POOLS
  // ----------------

  ProxyAdmin: {
    [eEthereumNetwork.coverage]: undefined,
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: "0x1C1A282F9892d1E565D7215a764E8fcd17726C3f",
    [eEthereumNetwork.rinkeby]: "0x8601bCbDC41a6Fe6422764EF1Dc8ccb7fa8B891B",
    [eEthereumNetwork.main]: "0xe635D0fb1608aA54C3ca99c497E887d2e1E3E690",
    [eEthereumNetwork.sepolia]: undefined,
  },

  ProxyAdminWithoutTimelock: {
    [eEthereumNetwork.coverage]: undefined,
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.localhost]: undefined,
    [eEthereumNetwork.goerli]: "0x89a60BB6cE83D4514dA956165664Ba6Ee4c15687",
    [eEthereumNetwork.rinkeby]: "0x27dC5B3BBb3c87130EBE1C96B3B8d169cB10EaF8",
    [eEthereumNetwork.main]: "0x2F886F5e1DBF63cB14579eb5BE6295A818Bd1795",
    [eEthereumNetwork.sepolia]: undefined,
  },

  BNFTRegistry: {
    [eEthereumNetwork.coverage]: "",
    [eEthereumNetwork.hardhat]: "",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x37A76Db446bDB3EF1b73112a8D5E6868de06464f",
    [eEthereumNetwork.rinkeby]: "0xB873F088EB721261bc88BbC739B5C794e02e414b",
    [eEthereumNetwork.main]: "0x79d922DD382E42A156bC0A354861cDBC4F09110d",
    [eEthereumNetwork.sepolia]: undefined,
  },
  BNFTRegistryOwner: {
    [eEthereumNetwork.coverage]: "",
    [eEthereumNetwork.hardhat]: "",
    [eEthereumNetwork.localhost]: "0xafF5C36642385b6c7Aaf7585eC785aB2316b5db6",
    [eEthereumNetwork.goerli]: "0xafF5C36642385b6c7Aaf7585eC785aB2316b5db6",
    [eEthereumNetwork.rinkeby]: "0xafF5C36642385b6c7Aaf7585eC785aB2316b5db6",
    [eEthereumNetwork.main]: "",
    [eEthereumNetwork.sepolia]: undefined,
  },

  CryptoPunksMarket: {
    [eEthereumNetwork.coverage]: "", // deployed in local evm
    [eEthereumNetwork.hardhat]: "", // deployed in local evm
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0xBccC7a1E79215EC3FD36824615801BCeE0Df2eC3",
    [eEthereumNetwork.rinkeby]: "0x6389eA3Cf6dE815ba76d7Cf4C6Db6A7093471bcb",
    [eEthereumNetwork.main]: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
    [eEthereumNetwork.sepolia]: undefined,
  },
  WrappedPunkToken: {
    [eEthereumNetwork.coverage]: "", // deployed in local evm
    [eEthereumNetwork.hardhat]: "", // deployed in local evm
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0xbeD1e8B430FD512b82A18cb121a8442F3889E505",
    [eEthereumNetwork.rinkeby]: "0x74e4418A41169Fb951Ca886976ccd8b36968c4Ab",
    [eEthereumNetwork.main]: "0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6",
    [eEthereumNetwork.sepolia]: undefined,
  },
  BoundPunkGateway: {
    [eEthereumNetwork.coverage]: "",
    [eEthereumNetwork.hardhat]: "",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x0f72Dae580E04AdAe973cD12C4f8FdCE8d23cAC6",
    [eEthereumNetwork.rinkeby]: "0xF482E6E29c0fe449b2A7326CDe850dcf8CE62e32",
    [eEthereumNetwork.main]: "0x9f3A8d7F61F6407190fe5264ad88F88F39e214a8",
    [eEthereumNetwork.sepolia]: undefined,
  },

  UserFlashclaimRegistryV3: {
    [eEthereumNetwork.coverage]: "",
    [eEthereumNetwork.hardhat]: "",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x9f7E2921ed5edb3217598988A303D1711fBB0909",
    [eEthereumNetwork.rinkeby]: "",
    [eEthereumNetwork.main]: "0x14f167aBdBa026C379142436a68d8979a342EcB5",
    [eEthereumNetwork.sepolia]: undefined,
  },
  AirdropDistribution: {
    [eEthereumNetwork.coverage]: "",
    [eEthereumNetwork.hardhat]: "",
    [eEthereumNetwork.localhost]: "",
    [eEthereumNetwork.goerli]: "0x3CF52C9ce29a1df2adCd0Ce657BbBBB63A3f9D01",
    [eEthereumNetwork.rinkeby]: "0x931d1664A61D4F4d47a262e321Ea11cbef50cb00",
    [eEthereumNetwork.main]: "0x6D187449A5664DD87E58A9d3b982989AaeA469BD",
    [eEthereumNetwork.sepolia]: undefined,
  },

  NftsAssets: {
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.localhost]: {},
    [eEthereumNetwork.main]: {},
    [eEthereumNetwork.rinkeby]: {},
    [eEthereumNetwork.goerli]: {},
    [eEthereumNetwork.sepolia]: {},
  },
};
