// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PepeCard is ERC20, Ownable {
    // 賭場優勢與兌現手續費，以基點表示（總基數 10000）
    uint256 public constant HOUSE_EDGE_BP = 500; // 5% 賭場優勢
    uint256 public constant REDEMPTION_FEE_BP = 200; // 2% 兌現手續費
    uint256 public constant PRECISION = 10000;
    uint256 public constant MIN_BUYIN = 100 wei;

    // 乘數常數 (共 25 張牌)
    uint256 public constant MULTIPLIER = 25;
    // 針對多項式方案：S(24)= A * (24*25*26)/3 = 5200*A 必須等於 25 * buyin * (1 - epsilon)
    // 因此原 A = (25 * buyin * (PRECISION - HOUSE_EDGE_BP)) / (PRECISION * 5200)
    // 為降低獎勵，額外引入難度因子 DIFFICULTY_FACTOR > 1
    uint256 public constant DIFFICULTY_FACTOR = 2; // 調高此值則獎勵更低

    // 遊戲狀態結構：board 為 5x5 陣列，對應 25 張牌，
    // 新增 nextReward 欄位用以儲存下一次翻牌的獎勵
    struct Game {
        bool[5][5] board; // false 表示未翻，true 表示已翻
        uint256 buyin; // 玩家買入金額（以 token 計）
        uint256 accumulation; // 累積獎金（以 token 計）
        uint8 flips; // 已安全翻牌次數（用於計算獎勵）
        uint8 ghostIndex; // 鬼牌所在位置 (0~24)
        uint256 nextReward; // 下一次安全翻牌的獎勵
    }

    mapping(address => bool) private _registeredUser;
    mapping(address => Game) private _ongoingGame;

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

    constructor(address owner) ERC20("PepeCard", "PC") Ownable(msg.sender) {
        // 將所有 token 都 mint 給合約本身
        _mint(address(this), 1000000000 ether);
    }

    // 當有人發送 ETH 至合約時，自動登記成使用者，並依照匯率轉出 token (10000 wei = 1 PC)
    receive() external payable {
        _registeredUser[msg.sender] = true;
        _transfer(address(this), msg.sender, msg.value * 10000);
    }

    function TakeOut() external payable onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Contract has no ETH balance");

        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
    }

    function FreeToken() external onlyOwner {
        _mint(owner(), 10000 ether);
    }

    /// @notice 玩家開始遊戲，必須支付一定 buyin（以 token 計）
    /// @param credit 買入金額（單位與 token 相同，且 ≥ MIN_BUYIN）
    function StartGame(uint256 credit) public {
        require(credit > 0, "Credit must be > 0");
        require(credit >= MIN_BUYIN, "Credit must be more than MIN_BUYIN");
        require(
            _ongoingGame[msg.sender].buyin == 0,
            "Game already in progress"
        );
        require(balanceOf(msg.sender) >= credit, "Insufficient tokens");
        _transfer(msg.sender, address(this), credit);

        Game memory newGame;
        newGame.buyin = credit;
        newGame.accumulation = 0;
        newGame.flips = 0;
        // 產生偽隨機鬼牌位置（0~24）
        newGame.ghostIndex = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        msg.sender
                    )
                )
            ) % 25
        );
        // 計算初始獎勵
        uint256 A = (MULTIPLIER * credit * (PRECISION - HOUSE_EDGE_BP)) /
            (PRECISION * 5200 * DIFFICULTY_FACTOR);
        newGame.nextReward = 2 * A;

        _ongoingGame[msg.sender] = newGame;

        emit GameStarted(msg.sender, credit);
    }

    /// @notice 修改後的 GameState
    /// @return board, buyin, accumulation, flips, nextReward
    function GameState()
        public
        view
        returns (bool[5][5] memory, uint256, uint256, uint8, uint256)
    {
        Game storage g = _ongoingGame[msg.sender];
        return (g.board, g.buyin, g.accumulation, g.flips, g.nextReward);
    }

    /// @notice 玩家翻牌，輸入牌面索引（0~24）；若翻到鬼牌則遊戲結束
    /// @param index 牌面索引（0~24），對應 board 中位置 (row = index/5, col = index%5)
    /// @return 若安全則返回此次翻牌獲得的獎勵；若翻到鬼牌則返回 0
    function FlipCard(uint256 index) public returns (uint256) {
        require(index < 25, "Index out of bounds");
        Game storage g = _ongoingGame[msg.sender];
        require(g.buyin > 0, "No ongoing game");

        uint8 row = uint8(index / 5);
        uint8 col = uint8(index % 5);
        require(g.board[row][col] == false, "Card already flipped");

        g.board[row][col] = true;

        if (uint8(index) == g.ghostIndex) {
            emit CardFlipped(msg.sender, index, 0, true);
            delete _ongoingGame[msg.sender];
            return 0;
        } else {
            uint256 A = (MULTIPLIER * g.buyin * (PRECISION - HOUSE_EDGE_BP)) /
                (PRECISION * 5200 * DIFFICULTY_FACTOR);
            uint256 n = uint256(g.flips) + 1;
            uint256 reward = A * (n * n + n);
            g.accumulation += reward;
            g.flips += 1;

            uint256 next_n = uint256(g.flips) + 1;
            g.nextReward = A * (next_n * next_n + next_n);

            emit CardFlipped(msg.sender, index, reward, false);
            return reward;
        }
    }

    /// @notice 玩家選擇停手，將目前累積獎金提領回自己的 token 餘額
    function Leave() public {
        Game storage g = _ongoingGame[msg.sender];
        require(g.buyin > 0, "No ongoing game");
        uint256 payout = g.accumulation;
        delete _ongoingGame[msg.sender];
        if (payout > 0) {
            _transfer(address(this), msg.sender, payout);
        }
        emit GameLeft(msg.sender, payout);
    }

    /// @notice 兌現函數：玩家可將部分 token 兌換成 ETH，
    ///         兌現時將收取一定手續費（此處為 2%），
    ///         兌現比例為 10000 token 換 1 ETH。
    /// @param tokenAmount 玩家欲兌現的 token 數量（單位為 token 的最小單位）
    function redeem(uint256 tokenAmount) public {
        require(tokenAmount > 0, "Token amount must be > 0");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient tokens");

        uint256 fee = (tokenAmount * REDEMPTION_FEE_BP) / PRECISION;
        uint256 netTokens = tokenAmount - fee;
        uint256 ethAmount = netTokens / 10000;
        require(
            address(this).balance >= ethAmount,
            "Contract has insufficient ETH"
        );

        _burn(msg.sender, netTokens);
        _transfer(msg.sender, owner(), fee);

        payable(msg.sender).transfer(ethAmount);

        emit Redeemed(msg.sender, tokenAmount, ethAmount, fee);
    }
}
