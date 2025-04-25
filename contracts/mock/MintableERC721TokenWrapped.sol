// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.20;

import {ERC721TokenWrapped} from "./ERC721TokenWrapped.sol";

contract MintableERC721TokenWrapped is ERC721TokenWrapped {
  constructor(
    string memory name,
    string memory symbol,
    string memory baseTokenURI
  ) ERC721TokenWrapped(name, symbol, baseTokenURI) {}

  function mint(address to, uint256 tokenId, string memory inscriptionId) public override {
    //adjust exist
    require(bytes(mpTokenId2InscriptionId[tokenId]).length <= 0, "tokenId is repeat");
    require(!mpInscriptionId2TokenId[inscriptionId].isUsed, "inscriptionId is repeat");

    mpInscriptionId2TokenId[inscriptionId] = TokenId(tokenId, true);
    mpTokenId2InscriptionId[tokenId] = inscriptionId;

    _mint(to, tokenId);
  }
}
