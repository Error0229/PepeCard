// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PepeCard is ERC20 {
    address private _owner;

    // 賭場優勢與手續費，均以基點表示（總基數 10000）
    uint256 public constant HOUSE_EDGE_BP = 500; // 5% 賭場優勢
    uint256 public constant REDEMPTION_FEE_BP = 200; // 2% 兌現手續費
    uint256 public constant PRECISION = 10000;
    uint256 public constant MIN_BUYIN = 100 wei;

    // 乘數常數 (共 25 張牌)
    uint256 public constant MULTIPLIER = 25;

    // 針對多項式方案：當玩家成功翻完 24 張安全牌時，
    // 累積獎金 S(24) = A * (24*25*26)/3 = 5200*A 必須等於 25 * buyin * (1 - epsilon)
    // 故分母固定為 5200
    // epsilon 由 HOUSE_EDGE_BP 表示

    // 遊戲狀態結構，board 為 5x5 的陣列，對應 25 張牌
    struct Game {
        bool[5][5] board; // false 表示未翻牌，true 表示已翻
        uint256 buyin; // 玩家買入金額（以 token 計）
        uint256 accumulation; // 累積獎金（以 token 計）
        uint8 flips; // 已安全翻牌次數（用於計算獎勵）
        uint8 ghostIndex; // 鬼牌所在位置 (0~24)
    }

    mapping(address => bool) private _registeredUser;
    mapping(address => Game) private _ongoingGame;
    uint256 public _totalSupply = 0;

    event GameStarted(address indexed player, uint256 buyin);
    event CardFlipped(
        address indexed player,
        uint256 index,
        uint256 reward,
        bool ghost
    );
    event GameLeft(address indexed player, uint256 payout);
    event Redeemed(
        address indexed player,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 fee
    );

    constructor(address owner) ERC20("PepeCard", "PC") {
        _owner = owner;
        // 將所有 token 都 mint 給合約本身
        _mint(address(this), 1000000000 ether);
    }

    // 當有人發送 ETH 至合約時，自動登記成使用者，並依照匯率轉出 token (10000 wei = 1 PC)
    receive() external payable {
        _registeredUser[msg.sender] = true;
        _transfer(address(this), msg.sender, msg.value * 10000);
    }

    /// @notice 玩家開始遊戲，必須支付一定 credit（買入金額）
    /// @param from 玩家地址（必須與 msg.sender 相同）
    /// @param credit 買入金額（單位與 token 相同）
    function StartGame(address from, uint256 credit) public {
        require(msg.sender == from, "Not authorized");
        require(credit > 0, "Credit must be > 0");
        // 檢查玩家是否已有進行中的遊戲
        require(_ongoingGame[from].buyin == 0, "Game already in progress");
        // 玩家必須有足夠 token 並事先批准合約扣款
        require(balanceOf(from) >= credit, "Insufficient tokens");
        require(credit >= MIN_BUYIN, "Credit must more than MIN_BUYIN");
        _transfer(from, address(this), credit);

        // 初始化遊戲（board 初始皆為 false）
        Game memory newGame;
        newGame.buyin = credit;
        newGame.accumulation = 0;
        newGame.flips = 0;
        // 利用 keccak256 產生偽隨機數決定鬼牌位置（0~24）
        newGame.ghostIndex = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(block.timestamp, block.prevrandao, from)
                )
            ) % 25
        );

        _ongoingGame[from] = newGame;

        emit GameStarted(from, credit);
    }

    /// @notice Owner-only function to peek at the ghost index of any player's ongoing game
    /// @param player The address of the player whose ghost index is being checked
    /// @return ghostIndex The index of the ghost card
    function PeekGhostIndex(
        address player
    ) external view returns (uint8 ghostIndex) {
        require(msg.sender == _owner, "Only owner can peek");
        Game storage g = _ongoingGame[player];
        require(g.buyin > 0, "Player has no ongoing game");
        return g.ghostIndex;
    }

    /// @notice Modified GameState function to prevent exposing ghost index publicly
    /// @param from Player's address
    /// @return board, buyin, accumulation, flips (excluding ghost index)
    function GameState(
        address from
    ) public view returns (bool[5][5] memory, uint256, uint256, uint8) {
        Game storage g = _ongoingGame[from];
        return (g.board, g.buyin, g.accumulation, g.flips);
    }

    /// @notice 玩家翻牌，傳入牌面索引（0~24）；若翻到鬼牌則遊戲結束
    /// @param from 玩家地址（必須與 msg.sender 相同）
    /// @param index 牌面索引（0~24），對應 board 中位置（row = index/5, col = index%5）
    /// @return 若安全則回傳此次翻牌獲得的獎勵金額；若翻到鬼牌則回傳 0
    function FlipCard(address from, uint256 index) public returns (uint256) {
        require(msg.sender == from, "Not authorized");
        require(index < 25, "Index out of bounds");
        Game storage g = _ongoingGame[from];
        require(g.buyin > 0, "No ongoing game");

        uint8 row = uint8(index / 5);
        uint8 col = uint8(index % 5);
        require(g.board[row][col] == false, "Card already flipped");

        // 標記此牌為已翻
        g.board[row][col] = true;

        // 如果翻到鬼牌，則遊戲立即結束，累積獎金清零
        if (uint8(index) == g.ghostIndex) {
            emit CardFlipped(from, index, 0, true);
            delete _ongoingGame[from];
            return 0;
        } else {
            // 若安全，計算此次獎勵
            // 多項式方案：Reward(n)= A*(n^2+n)，其中 n = g.flips + 1
            // 當成功翻完 24 張安全牌時，累積獎金 S(24) = A*(24*25*26)/3 = 5200*A = 25 * buyin * (1 - epsilon)
            // 因此 A = (25 * buyin * (PRECISION - HOUSE_EDGE_BP)) / (PRECISION * 5200)
            uint256 A = (MULTIPLIER * g.buyin * (PRECISION - HOUSE_EDGE_BP)) /
                (PRECISION * 5200);
            uint256 n = uint256(g.flips) + 1; // 第 n 次安全翻牌
            uint256 reward = A * (n * n + n); // Reward(n) = A*(n^2+n)

            g.accumulation += reward;
            g.flips += 1;

            emit CardFlipped(from, index, reward, false);
            return reward;
        }
    }

    /// @notice 玩家選擇停手，將目前累積獎金提領回自己的 token 餘額
    /// @param from 玩家地址（必須與 msg.sender 相同）
    function Leave(address from) public {
        require(msg.sender == from, "Not authorized");
        Game storage g = _ongoingGame[from];
        require(g.buyin > 0, "No ongoing game");
        uint256 payout = g.accumulation;
        // 遊戲結束，刪除該遊戲狀態
        delete _ongoingGame[from];
        if (payout > 0) {
            _transfer(address(this), from, payout);
        }
        emit GameLeft(from, payout);
    }

    /// @notice 兌現函數：玩家可將部分 token 兌換成 ETH，
    ///         兌現時將收取一定手續費（此處為 2%），剩餘 token 按 10000:1 的比率換成 ETH。
    /// @param tokenAmount 玩家欲兌現的 token 數量（單位為 token 的最小單位）
    function redeem(uint256 tokenAmount) public {
        require(tokenAmount > 0, "Token amount must be > 0");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient tokens");

        // 計算手續費與淨額
        uint256 fee = (tokenAmount * REDEMPTION_FEE_BP) / PRECISION;
        uint256 netTokens = tokenAmount - fee;

        // 根據發行規則：當用戶發送 1 ETH，合約發送 msg.value*10000 token
        // 因此，兌現時 10000 token 對應 1 ETH
        uint256 ethAmount = netTokens / 10000;
        require(
            address(this).balance >= ethAmount,
            "Contract has insufficient ETH"
        );

        // 先執行狀態變更：扣除用戶 token（淨額銷毀，手續費轉入 owner）
        _burn(msg.sender, netTokens);
        _transfer(msg.sender, _owner, fee);

        // 再進行外部互動：發送 ETH 至用戶
        payable(msg.sender).transfer(ethAmount);

        emit Redeemed(msg.sender, tokenAmount, ethAmount, fee);
    }
}
