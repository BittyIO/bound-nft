[![Build pass](https://github.com/BittyIO/bound-nft/actions/workflows/node.js.yml/badge.svg)](https://github.com/BittyIO/bound-nft/actions/workflows/node.js.yml)

## Thanks
bound-nft fork from [boundnft-protocol](https://github.com/BendDAO/boundnft-protocol)
Thanks BendDAO for the opensouce spirit & code.

## Setup
Create an enviroment file named `.env` and fill the next enviroment variables

```
# private key for deoployer
PRIVATE_KEY=""

# Add Alchemy or Infura provider keys, alchemy takes preference at the config level
ALCHEMY_KEY=""
INFURA_KEY=""

# Optional Etherscan key, for automatize the verification of the contracts at Etherscan
ETHERSCAN_KEY=""

```
## Test

```
npm run test
```

## Deployments

```
npx hardhat deploy:deploy-all --network ${network}
```
