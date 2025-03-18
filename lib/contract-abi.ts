export const contractABI = [
  // ERC20 functions
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",

  // Game functions
  "function StartGame(address from, uint256 credit)",
  "function FlipCard(address from, uint256 index) returns (uint256)",
  "function Leave(address from)",
  "function redeem(uint256 tokenAmount)",
  "function GameState(address from) view returns (bool[5][5], uint256, uint256, uint8)",

  // Events
  "event GameStarted(address indexed player, uint256 buyin)",
  "event CardFlipped(address indexed player, uint256 index, uint256 reward, bool ghost)",
  "event GameLeft(address indexed player, uint256 payout)",
  "event Redeemed(address indexed player, uint256 tokenAmount, uint256 ethAmount, uint256 fee)",
]
