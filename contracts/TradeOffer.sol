// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TradeOffer is ERC721URIStorage, Ownable(msg.sender) {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Array to track token IDs currently held by the contract
    uint256[] private tokensHeld;

    // Mapping to track claim credits per address.
    // Each minted NFT gives the minter one claim credit.
    mapping(address => uint256) public credits;

    // Price in ETH required to claim a random NFT (example: 0.001 ETH)
    uint256 public constant price = 0.001 ether;

    constructor() ERC721("TradeOffer", "TF") {}

    /**
     * @notice Anyone can mint NFTs.
     * @dev The minted NFT is assigned to the contract itself. The minter earns one claim credit.
     * @param tokenURI The metadata URI for the NFT.
     * @return newItemId The ID of the newly minted NFT.
     *
     */
    function mintNFT(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        // Mint the NFT to the contract so that it holds the token
        _mint(address(this), newItemId);
        _setTokenURI(newItemId, tokenURI);

        // Add the token to the contract's holdings
        tokensHeld.push(newItemId);

        // Increase the sender's claim credit by 1
        credits[msg.sender] += 1;

        return newItemId;
    }

    /**
     * @notice When the contract receives ETH, it allows the sender to claim a random NFT,
     *         provided they have at least one claim credit.
     * @dev A pseudo-random method is used (not secure for production).
     */
    receive() external payable {
        require(msg.value >= price, "Insufficient ETH sent");
        require(credits[msg.sender] > 0, "No claim credit available");
        require(tokensHeld.length > 0, "No NFTs available for claim");

        // Pseudo-random index generation using block data and the sender's address
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
            )
        ) % tokensHeld.length;

        uint256 tokenId = tokensHeld[randomIndex];

        // Transfer the chosen NFT from the contract to the sender
        _update(msg.sender, tokenId, address(this));

        // Remove the token from tokensHeld using swap and pop for efficiency
        tokensHeld[randomIndex] = tokensHeld[tokensHeld.length - 1];
        tokensHeld.pop();

        // Consume one claim credit for the sender
        credits[msg.sender] -= 1;
    }

    /**
     * @notice (Optional) Allows the owner to withdraw collected ETH.
     */
    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @notice (Optional) Returns the list of token IDs currently held by the contract.
     * @return An array of token IDs.
     */
    function getTokensHeld() public view returns (uint256[] memory) {
        return tokensHeld;
    }
}
