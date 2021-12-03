// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./libraries/Base64.sol";
import "hardhat/console.sol";

/**
 * Contract to provide an ERC721 compliant interface for storing rocket game characters 
 * assembled from rocket part NFTs stored in the RocketPart.sol contract
 */

contract RocketCharacter is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    uint256 public initialCost = 10;
    uint256 public initialSpeed = 2700;
    uint256 public initialFuel = 30;
    uint256 public initialEarnings = 0;
    uint256 public initialOffline = 1;

    uint256 public speedUpgradeIncrement = 340;
    uint256 public fuelUpgradeIncrement = 7;
    uint256 public earningsUpgradeIncrement = 1;
    uint256 public offlineUpgradeIncrement = 2;
    uint256 public upgradeCostIncrement = 60;

    struct RocketCharacterAttributes {
        uint256 tokenId;
        string name;
        string imageURI;        
        uint256 speedIndex;
        uint256 fuelIndex;
        uint256 earningsIndex;
        uint256 offlineIndex;
        uint256 lastFlight;
    }

    mapping(address => uint256) balances;
    mapping(address => uint256[]) rocketHolders;
    mapping(uint256 => RocketCharacterAttributes) public rocketCharacterAttributes;

    event RocketCharacterMinted(address, uint256);
    event RocketCharacterAttributesChanged(address, uint256, RocketCharacterAttributes);
    event OfflineBonusAdded(address, uint256, uint256);
  
    address marketplaceAddress;

    constructor(address marketplaceAddress_) ERC721("Rocket Character", "RKTCH")  {
        marketplaceAddress = marketplaceAddress_;
    }

    function mintToken(string memory tokenUri)
    public
    returns (uint256)
    {
        require(rocketHolders[msg.sender].length < 3, "Maximum allowed rockets owned already reached."); 

        _tokenIds.increment();

        uint256 tokenId = _tokenIds.current();
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenUri);
        
        setApprovalForAll(marketplaceAddress, true);

        rocketCharacterAttributes[tokenId] = RocketCharacterAttributes({
            tokenId: tokenId,
            name: string(abi.encodePacked("RocketCharacter ", Strings.toString(tokenId))),
            imageURI: tokenUri,
            speedIndex: 1,
            fuelIndex: 1,
            earningsIndex: 1,
            offlineIndex: 1,
            lastFlight: 0
        });

        rocketHolders[msg.sender].push(tokenId);

        emit RocketCharacterMinted(msg.sender, tokenId);

        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        RocketCharacterAttributes memory _tokenAttributes = rocketCharacterAttributes[tokenId];
        string memory speed = Strings.toString(newAmount(_tokenAttributes.speedIndex, 0, speedUpgradeIncrement, initialSpeed));
        string memory fuel = Strings.toString(newAmount(_tokenAttributes.fuelIndex, 0, fuelUpgradeIncrement, initialFuel));
        string memory earnings = Strings.toString(newAmount(_tokenAttributes.earningsIndex, 0, earningsUpgradeIncrement, initialEarnings));
        string memory offline = Strings.toString(newAmount(_tokenAttributes.offlineIndex, 0, offlineUpgradeIncrement, initialOffline));

        string memory json = Base64.encode(
            bytes(
            string(
                abi.encodePacked(
                '{"name": "',_tokenAttributes.name,'","description": "An NFT Rocket lets people play in the game Metaverse.", "image": "',
                _tokenAttributes.imageURI,
                '", "attributes": [{ "display_type": "number", "trait_type": "Speed", "value": ',speed,'},{ "display_type": "number", "trait_type": "Fuel", "value": ',fuel,'},{ "display_type": "boost_percentage", "trait_type": "Earnings", "value": ',earnings,'},{ "display_type": "number", "trait_type": "Offline", "value": ',offline,'}]}'
                )
            )
            )
        );

        string memory output = string(
            abi.encodePacked("data:application/json;base64,", json)
        );
        
        return output;
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        removeFromRocketHolders(from, tokenId);
        rocketHolders[to].push(tokenId);
    }

    function getBalance() public view returns(uint256) {
        return balances[msg.sender];
    }

    function getTokenAttributes(uint256 tokenId) public view returns(RocketCharacterAttributes memory) {
        return rocketCharacterAttributes[tokenId];
    }

    function getRocketsOwned() public view returns (uint256[] memory) {
        return rocketHolders[msg.sender];
    }

    function applyOfflineBonus(uint256 tokenId) internal {
        uint256 currentBalance = balances[msg.sender];

        // apply offline bonus if applicable
        uint256 lastFlight = rocketCharacterAttributes[tokenId].lastFlight;
        if (lastFlight > 0) {
            uint256 secondsSinceLastFlight = block.timestamp - lastFlight;
            // Offline for over 24 hours gets you a bonus
            uint256 secondsInTwentyFourHours = 86400;
            if (secondsSinceLastFlight > secondsInTwentyFourHours) {
                uint256 minutesSinceLastFlight =  (secondsSinceLastFlight - secondsInTwentyFourHours) / 60;
                uint256 offlineCost = currentCost(rocketCharacterAttributes[tokenId].offlineIndex);
                uint256 offlineBonus = offlineCost * minutesSinceLastFlight;
                currentBalance = currentBalance + offlineBonus;
                emit OfflineBonusAdded(msg.sender, tokenId, offlineBonus);
            }
        }
    }

    function logFlightPlan(uint256 tokenId, uint256 speedUpgradeFactor, uint256 fuelUpgradeFactor, uint256 earningsUpgradeFactor, uint256 offlineUpgradeFactor) public {
        
        applyOfflineBonus(tokenId);

        uint256 currentBalance = balances[msg.sender];

        uint256 newSpeedUpgradeCost = upgradeCost(rocketCharacterAttributes[tokenId].speedIndex, speedUpgradeFactor);
        uint256 newFuelUpgradeCost = upgradeCost(rocketCharacterAttributes[tokenId].fuelIndex, fuelUpgradeFactor);
        uint256 newEarningsUpgradeCost = upgradeCost(rocketCharacterAttributes[tokenId].earningsIndex, earningsUpgradeFactor);
        uint256 newOfflineUpgradeCost = upgradeCost(rocketCharacterAttributes[tokenId].offlineIndex, offlineUpgradeFactor);
        uint256 upgradesCost = newSpeedUpgradeCost + newFuelUpgradeCost + newEarningsUpgradeCost + newOfflineUpgradeCost;

        require(currentBalance >= upgradesCost, "Insufficient funds to cover upgrades.");

        // decrement the msg.sender balance for upgrades
        uint256 newBalance = currentBalance - upgradesCost;
        balances[msg.sender] = newBalance;

        // update rocket attributes based on upgrade factors
        rocketCharacterAttributes[tokenId].speedIndex = rocketCharacterAttributes[tokenId].speedIndex + speedUpgradeFactor;
        rocketCharacterAttributes[tokenId].fuelIndex = rocketCharacterAttributes[tokenId].fuelIndex + fuelUpgradeFactor;
        rocketCharacterAttributes[tokenId].earningsIndex = rocketCharacterAttributes[tokenId].earningsIndex + earningsUpgradeFactor;
        rocketCharacterAttributes[tokenId].offlineIndex = rocketCharacterAttributes[tokenId].offlineIndex + offlineUpgradeFactor;

        // emit event
        RocketCharacterAttributes memory _rocketCharacterAttributes = rocketCharacterAttributes[tokenId];
        emit RocketCharacterAttributesChanged(msg.sender, tokenId, _rocketCharacterAttributes);
    }

    function logFlight(uint256 tokenId, uint256 height) public {
        // record the flight timestamp so we can apply offline bonus if applicable
        rocketCharacterAttributes[tokenId].lastFlight = block.timestamp;
        balances[msg.sender] = balances[msg.sender] + (currentCost(rocketCharacterAttributes[tokenId].earningsIndex) * height);
    }

    function removeFromRocketHolders(address from, uint tokenId) internal {
        uint256[] storage rocketHolderTokenIds = rocketHolders[from];
        bool isFound = false;
        
        if (rocketHolderTokenIds[rocketHolderTokenIds.length - 1] == tokenId){
            isFound = true;
        }
        else {
            for (uint i = 0; i < rocketHolderTokenIds.length - 1; i++) {
                if (!isFound && rocketHolderTokenIds[i] == tokenId) {
                    isFound = true;
                }

                if (isFound) {
                    rocketHolderTokenIds[i] = rocketHolderTokenIds[i + 1];
                }
            }
        }

        if (isFound){
            delete rocketHolderTokenIds[rocketHolderTokenIds.length - 1];
            rocketHolderTokenIds.pop();
        }
    }

    function sequenceValue(uint256 index) internal pure returns(uint256 amount) {
        return (30 * (index ** 2)) - 20;
    }
    
    function newAmount(uint256 currentIndex, uint256 upgradeMultiplier, uint256 increment, uint256 initalValue) public pure returns(uint) {
        uint256 newIndex = upgradeMultiplier + currentIndex;
        return ((newIndex - 1) * increment) + initalValue;
    }
    
    function currentCost(uint256 currentIndex) internal pure returns(uint) {
        return newCost(currentIndex, 0);
    }

    function newCost(uint256 currentIndex, uint256 upgradeFactor) public pure returns(uint) {
        uint256 newIndex = upgradeFactor + currentIndex;
        return sequenceValue(newIndex);
    }

    function upgradeCost(uint256 currentIndex, uint256 upgradeFactor) public pure returns(uint256) {

        uint256 cost = 0;
        uint newIndex = currentIndex + upgradeFactor;
        for (uint256 i = currentIndex; i < newIndex; i++) {
            cost = cost + currentCost(i);
        }

        return cost;
    }
}