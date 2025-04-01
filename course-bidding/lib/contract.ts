import { Contract, type BrowserProvider, JsonRpcProvider } from "ethers"

// Contract ABI (Application Binary Interface)
export const CONTRACT_ABI = [
  // ERC1155 and AccessControl functions
  "function supportsInterface(bytes4 interfaceId) public view returns (bool)",

  // CourseBidding specific functions
  "function name() public view returns (string)",
  "function TEACHER_ROLE() public view returns (bytes32)",
  "function CREDIT() public view returns (uint256)",
  "function courseCounter() public view returns (uint)",
  "function initialCredit() public view returns (uint)",
  "function courseIds(uint) public view returns (uint)",
  "function registered(address) public view returns (bool)",
  "function courses(uint) public view returns (uint, address, uint, bool, bool, string)",
  "function hasRole(bytes32 role, address account) public view returns (bool)",

  // Main functions
  "function register() public",
  "function createCourse(uint capacity, string memory metadataURI) public",
  "function bid(uint courseId, uint bidAmount) public",
  "function finalizeBidding(uint courseId) public",

  // Query functions
  "function getActiveCourses() public view returns (uint[] memory)",
  "function getFinalizedCourses() public view returns (uint[] memory)",
  "function getWinners(uint courseId) public view returns (address[] memory)",
  "function getBids(uint courseId) public view returns (address[] memory, uint[] memory)",

  // ERC1155 functions
  "function balanceOf(address account, uint256 id) public view returns (uint256)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) public",
]

// Contract address
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""

// Course structure from the contract
export interface Course {
  courseId: number
  teacher: string
  capacity: number
  biddingActive: boolean
  finalized: boolean
  metadataURI: string
  bids?: Bid[]
  winners?: string[]
}

// Bid structure from the contract
export interface Bid {
  bidder: string
  bidAmount: number
}

// Function to get contract instance
export async function getContract(provider: BrowserProvider) {
  const signer = await provider.getSigner()
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
}

// Function to get read-only contract instance
export function getReadOnlyContract() {
  // Use a public RPC URL for your network
  const provider = new JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/demo")
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
}
