// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./libraries/Base64.sol";
import "hardhat/console.sol";

/**
 * Contract to provide an ERC721 compliant interface for storing sound effects that
 * can be selected and used in the game.
 */

contract SoundEffect is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private backgroundIds;

    enum Type {
        Background,
        Explosion,
        Thrust,
        Ping
    }
    
    struct SoundEffectAttributes {
        uint256 id;
        string name;
        Type audioType;
        string audioURI;
    }

    mapping(uint256 => SoundEffectAttributes) public soundEffectAttributes;
    mapping(address => uint256[]) public soundEffectsPack;

    event SoundEffectMinted(address, uint256);
    event SoundEffectAttributesChanged(address,uint256, SoundEffectAttributes);

    constructor() ERC721("SoundEffect", "SNDEF")  {
    }

    function nameForComponentType(Type componentType) internal pure returns(string memory name) {
        if (componentType == Type.Background) {
            return "Background";
        } else if (componentType == Type.Explosion) {
            return "Explosion";
        } else if(componentType == Type.Thrust) {
             return "Thrust";
        } else if(componentType == Type.Ping) {   
            return "Ping";
        }
    }


    function setSoundEffectsPack(uint256[] memory tokenIds) public {
        soundEffectsPack[msg.sender] = tokenIds;
    }

    function getSoundEffectsPack() public view returns(SoundEffectAttributes[] memory) {
        uint256[] memory tokenIds = soundEffectsPack[msg.sender];
        if (tokenIds.length == 0) {
            return new SoundEffectAttributes[](0); 
        }

        SoundEffectAttributes[] memory _soundEffectAttributes = new SoundEffectAttributes[](tokenIds.length);
        for(uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            _soundEffectAttributes[i] = soundEffectAttributes[tokenId];
        }

        return _soundEffectAttributes;
    }

    function mintToken(Type audioType, string memory tokenUri)
    public
    returns (uint256)
    {
        _tokenIds.increment();

        uint256 id = _tokenIds.current();
        _safeMint(msg.sender, id);
        _setTokenURI(id, tokenUri);
        
        soundEffectAttributes[id] = SoundEffectAttributes({
            id: id,
            name: nameForComponentType(audioType),
            audioType: audioType,
            audioURI: tokenUri
        });

        emit SoundEffectMinted(msg.sender, id);

        return id;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        SoundEffectAttributes memory _soundEffectAttributes = soundEffectAttributes[tokenId];
        Type componentType = _soundEffectAttributes.audioType;

        string memory json = Base64.encode(
            bytes(
            string(
                abi.encodePacked(
                '{"name": "Rocket Sound Effect (',
                _soundEffectAttributes.name,
                ') #:',
                Strings.toString(tokenId),
                '", "description": "An NFT Rocket sound effect lets people play in the game Metaverse.", "audio": "',
                _soundEffectAttributes.audioURI,
                '", "attributes": [{ "display_type": "string", "trait_type": "Component Type", "value": ',componentType,'}]}'
                )
            )
            )
        );

        string memory output = string(
            abi.encodePacked("data:application/json;base64,", json)
        );
        
        return output;
    }

    function getTokenAttributes(uint256 tokenId) public view returns(SoundEffectAttributes memory) {
        return soundEffectAttributes[tokenId];
    }

    function getSoundEffects() public view returns (SoundEffectAttributes[] memory) {
        uint256 numberOfTokens = _tokenIds.current();
        SoundEffectAttributes[] memory soundEffects = new SoundEffectAttributes[](numberOfTokens);
        for (uint i = 0; i < _tokenIds.current(); i++) {
            soundEffects[i] = soundEffectAttributes[i + 1];
        }
        
        return soundEffects;
    }
}
