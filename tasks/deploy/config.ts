
export enum Network {
  sepolia = "sepolia",
  main = "main",
}

export interface Params<T> {
  [Network.sepolia]: T;
  [Network.main]: T;
}



export const getParams = <T>({ sepolia, main }: Params<T>, network: string): T => {
  network = Network[network as keyof typeof Network];
  switch (network) {
    case Network.sepolia:
      return sepolia;
    case Network.main:
      return main;
    default:
      return sepolia;
  }
};


export const BNFTConfigs: Params<Record<string, string>> = {
  [Network.sepolia]: {
    BNftNamePrefix: "Bound NFT",
    BNftSymbolPrefix: "bound",
  },
  [Network.main]: {
    BNftNamePrefix: "Bound NFT",
    BNftSymbolPrefix: "bound",
  },
};

export const NftAssets: Params<Record<string, string>> = {
  [Network.sepolia]: {
    WPUNKS: '0xd4B17E11824F3cF0253cE012C8cD6B3300b2FFB5',
    BAYC: '0x00000066c6904D21F978A85D4D35719039E0f2Cb',
    MAYC: '0x000000A76D0B02Fd7f6f5C4E93F591f547EA2AFB',
    AZUKI: '0x0000008878FAf8CeE9859Af45c94Bc97818bba89',
    MEEBITS: '0x0000000D61B6Ec04C0Ac8De4a065D6626eCC313A',
    MIL: '0x000000553C40DBe365ccCD4690d188F1AA957ED1',
    PUDGY: '0x000088fb0b3f8c43da271DB60098A000D8bf1a62',
    MFER: '0x000000FFe81592Aafa726938b672E1d94bA58d05',
    LILP: '0x0000000EB7a675E278a37532E027754fB92716B8',
    TEST: '0x0000Fe4C00AB4e80340CdDD7c9005200e70BE9f4',
    DOODLE: '0x00000093dC3E458054Dd6e84D5baa645688291d7',
    MOONBIRD: '0x00000053551006776eEC9b448154090DaFB68461',
    MYTHICS: '0x000000eb85125c5b5dd3400b4400fdbb3d6418bb'
  },
  [Network.main]: {
    WPUNKS: '0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6',
    BAYC: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    MAYC: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
    AZUKI: '0xed5af388653567af2f388e6224dc7c4b3241c544',
    MEEBITS: '0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7',
    MIL: '0x5af0d9827e0c53e4799bb226655a1de152a425a5',
    PUDGY: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
    MFER: '0x79fcdef22feed20eddacbb2587640e45491b757f',
    LILP: '0x524cab2ec69124574082676e6f654a18df49a048',
  },
};
