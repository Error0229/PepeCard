= Blockchain HW1


== Task 1:  Deploy ERC20 Token
Contract Address:#link("https://sepolia.etherscan.io/address/0x8a899A996b233bFFc73cBDEf0BDB8817fcd6a4Fb")[ `0x8a899A996b233bFFc73cBDEf0BDB8817fcd6a4Fb`]
#box(
  image("pc.png")
)
Demo website: `https://pepe-card.vercel.app/`

== Game Description
PepeCard is a risk-reward card flipping game implemented as a smart contract. Here's how it works:

=== Game Rules
- Players start by buying in with tokens (minimum 100 wei)
- There's a 5x5 grid of cards (25 total)
- One card is randomly selected as the "ghost card"
- Players flip cards one at a time
- Each safe flip earns increasing rewards
- If the ghost card is flipped, the game ends and all accumulated rewards are lost
- Players can "Leave" at any time to collect their accumulated rewards

=== Reward Mechanism
- Rewards increase quadratically with each successful flip
- House edge is 5%
- Base reward formula: A \* (n² + n), where:
  - A = (25 \* buyin \* 0.95) / (5200 \* 2)
  - n = number of successful flips
- Players can redeem(burn) tokens for ETH at a rate of 10000:1 with a 2% redemption fee

=== Only Owner Functions
- `TakeOut()`: Allows the owner to withdraw all ETHs from the contract
- `FreeToken()`: Mints 10000 tokens to the owner

=== Failed Transaction
When a non-owner tries to call the `FreeToken()` function, the transaction will fail with `OwnableUnauthorizedAccount` message. ex: #link("https://sepolia.etherscan.io/tx/0xee9389db90693ab65c2addf7b9cd97aabe6e1836413a574924c8b5524aa75829", `0xee9389db90693ab65c2addf7b9cd97aabe6e1836413a574924c8b5524aa75829`)

#box(
  image("Failed_erc20.png")
)

== Task 2: Deploy ERC721 Token
