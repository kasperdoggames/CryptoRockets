// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

/**
 * Contract to provide a marketplace to buy and sell the ERC721 NFTs held in the 
 * RocketCharacter.sol contract.
 */

contract Market is ReentrancyGuard {
  using Counters for Counters.Counter;
  Counters.Counter private itemIds;
  Counters.Counter private itemIdsRemoved;

  address payable owner;
  uint256 listingPrice = 0.025 ether;

  constructor() {
    owner = payable(msg.sender);
  }

  struct MarketItem {
    uint itemId;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    uint256 price;
    bool isExist;
  }

  mapping(uint256 => MarketItem) private idToMarketItem;

  event MarketItemCreated (
    uint indexed itemId,
    address indexed nftContract,
    uint256 indexed tokenId,
    address seller,
    uint256 price
  );

  event MarketItemSaleCancelled (
    uint indexed itemId,
    address indexed nftContract,
    uint256 indexed tokenId,
    address seller
  );

  event MarketItemSold (
    uint indexed itemId,
    address indexed nftContract,
    uint256 indexed tokenId,
    address seller,
    address owner,
    uint256 price
  );

  /* Returns the listing price of the contract */
  function getListingPrice() public view returns (uint256) {
    return listingPrice;
  }
  
  /* Places an item for sale on the marketplace */
  function setMarketForSale(
    address nftContract,
    uint256 tokenId,
    uint256 price
  ) public payable nonReentrant returns(uint256) {
    require(price > 0, "Price must be at least 1 wei");
    require(msg.value == listingPrice, "Price must be equal to listing price");

    itemIds.increment();
    uint256 itemId = itemIds.current();
  
    idToMarketItem[itemId] =  MarketItem(
      itemId,
      nftContract,
      tokenId,
      payable(msg.sender),
      price,
      true
    );

    IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

    emit MarketItemCreated(
      itemId,
      nftContract,
      tokenId,
      msg.sender,
      price
    );

    return itemId;
  }

  /* Performs the sale of a marketplace item */
  /* Transfers ownership of the item, as well as funds between parties */
  function setMarketSold(
    address nftContract,
    uint256 itemId
    ) public payable nonReentrant {

    address seller = idToMarketItem[itemId].seller;
    require(msg.sender != seller, "Cannot buy your own rocket");

    uint price = idToMarketItem[itemId].price;
    uint tokenId = idToMarketItem[itemId].tokenId;
    require(msg.value == price, "Please submit the asking price in order to complete the purchase");

    idToMarketItem[itemId].seller.transfer(msg.value);
    IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
    payable(owner).transfer(listingPrice);
    idToMarketItem[itemId].isExist = false;
    itemIdsRemoved.increment();

    emit MarketItemSold (
      itemId,
      nftContract,
      tokenId,
      seller,
      msg.sender,
      price
    );
  }

  /* Returns all market items that are for sale */
  function getMarketItems() public view returns (MarketItem[] memory) {
    uint itemCount = itemIds.current();
    uint itemsRemovedCount = itemIdsRemoved.current();
    uint currentCount = itemCount - itemsRemovedCount;
    uint currentIndex = 0;

    MarketItem[] memory items = new MarketItem[](currentCount);
    for (uint i = 0; i < itemCount; i++) {
      if (idToMarketItem[i + 1].isExist) {
        uint currentId = i + 1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }

    return items;
  }

  function cancelSale(
    address nftContract,
    uint256 itemId
    ) public nonReentrant {

    require(idToMarketItem[itemId].isExist,"Market item not for sale"); 
    require(msg.sender == idToMarketItem[itemId].seller, "You are not the seller");

    uint tokenId = idToMarketItem[itemId].tokenId;
    IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
    idToMarketItem[itemId].isExist = false;
    itemIdsRemoved.increment();

    emit MarketItemSaleCancelled (
      itemId,
      nftContract,
      tokenId,
      msg.sender
    );
  }
}