export const contractABI = [
  // Constructor and basic ERC721 functions
  "constructor()",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",

  // Custom contract functions
  "function mintNFT(string memory tokenURI) public returns (uint256)",
  "function credits(address) public view returns (uint256)",
  "function getTokensHeld() public view returns (uint256[])",
  "function withdraw() public",

  // ERC721 transfer functions
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)"
]
