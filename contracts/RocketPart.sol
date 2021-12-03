// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./libraries/Base64.sol";
import "hardhat/console.sol";

/**
 * Contract to provide an ERC721 compliant interface for storing rocket parts that are
 * assembled into rocket characters and stored in RocketCharacter.sol contract.
 */

contract RocketPart is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    enum Type {
        Nose,
        Fuselage,
        Tail
    }
    
    struct RocketPartAttributes {
        uint256 id;
        string name;
        Type partType;
        string tokenUri;
    }

    mapping(uint256 => RocketPartAttributes) public rocketPartAttributes;

    event RocketComponentMinted(address, uint256);
    event RocketPartAttributesChanged(address,uint256, RocketPartAttributes);

    constructor() ERC721("Rocket Part", "RKTPA")  {
    }

    function nameForComponentType(Type partType) internal pure returns(string memory name) {
        if (partType == Type.Nose) {
            return "Nose";
        } else if(partType == Type.Fuselage) {
             return "Fuselage";
        } else if(partType == Type.Tail) {   
            return "Tail";
        }
    }

    function mintToken(Type partType, string memory tokenUri)
    public
    returns (uint256)
    {
        _tokenIds.increment();

        uint256 id = _tokenIds.current();
        _safeMint(msg.sender, id);
        _setTokenURI(id, tokenUri);
        
        // setApprovalForAll(gameManagerAddress, true);

        rocketPartAttributes[id] = RocketPartAttributes({
            id: id,
            name: nameForComponentType(partType),
            partType: partType,
            tokenUri: tokenUri
        });

        emit RocketComponentMinted(msg.sender, id);

        return id;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        RocketPartAttributes memory _rocketPartAttributes = rocketPartAttributes[tokenId];
        Type partType = _rocketPartAttributes.partType;

        string memory json = Base64.encode(
            bytes(
            string(
                abi.encodePacked(
                '{"name": "Rocket Component (',
                _rocketPartAttributes.name,
                ') #:',
                Strings.toString(tokenId),
                '", "description": "An NFT Rocket component lets people play in the game Metaverse.", "image": "',
                _rocketPartAttributes.tokenUri,
                '", "attributes": [{ "display_type": "string", "trait_type": "Component Type", "value": ',partType,'}]}'
                )
            )
            )
        );

        string memory output = string(
            abi.encodePacked("data:application/json;base64,", json)
        );
        
        return output;
    }

    function tokenAttributes(uint256 tokenId) public view returns(RocketPartAttributes memory) {
        return rocketPartAttributes[tokenId];
    }

    function getAllRocketParts() public view returns (RocketPartAttributes[] memory) {
        uint256 numberOfTokens = _tokenIds.current();
        RocketPartAttributes[] memory rocketParts = new RocketPartAttributes[](numberOfTokens);
        for (uint i=1; i <= _tokenIds.current(); i++) {
            rocketParts[i-1] = rocketPartAttributes[i];
        }
        return rocketParts;
    }
}
