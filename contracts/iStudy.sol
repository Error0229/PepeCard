// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 匯入 OpenZeppelin 的 ERC1155 與權限控管模組
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title StudentQuestionBoard
 * @dev 利用 ERC1155 實作學生提問／老師回覆與獎勵系統
 *
 * token 定義：
 * - STUDENT_TOKEN (id = 0)：學生註冊時獲得的 fungible token，用於支付提問成本
 * - PRIZE_TOKEN   (id = 3)：獎勵用 fungible token，由老師發放
 * - 問題 NFT        : token id 從 1000 起算，每筆提問鑄造一個 NFT
 * - 回答 NFT        : token id 從 2000 起算，每筆回答鑄造一個 NFT
 * - Prize NFT      : token id 從 3000 起算，老師可發行，學生可用 PRIZE_TOKEN 購買
 *
 * 修改重點：
 * 1. 學生發問時可投入 stakeAmount，作為後續獎勵計算依據。
 * 2. 除了爛問題外，處理後問題 NFT 不會被銷毀：
 *    - 若該 NFT 原屬於老師（老師提問），則轉移給回答學生；
 *    - 否則（學生發問），學生保留原有 NFT。
 */
contract StudentQuestionBoard is ERC1155, AccessControl {
    // 定義老師角色
    bytes32 public constant TEACHER_ROLE = keccak256("TEACHER_ROLE");

    // 定義 token id
    uint256 public constant STUDENT_TOKEN = 0;
    uint256 public constant PRIZE_TOKEN = 3;

    // NFT token id 起始值
    uint256 private constant QUESTION_NFT_START = 1000;
    uint256 private constant ANSWER_NFT_START = 2000;
    uint256 private constant PRIZE_NFT_START = 3000;

    // 計數器
    uint256 private _questionCounter = QUESTION_NFT_START;
    uint256 private _answerCounter = ANSWER_NFT_START;
    uint256 private _prizeNFTCounter = PRIZE_NFT_START;

    // 註冊學生記錄，避免重複註冊
    mapping(address => bool) public registeredStudents;
    // 記錄每筆問題 NFT 的發起者（學生或老師）
    mapping(uint256 => address) public questionOwner;
    // 記錄學生發問時投入的 token 數量，用以計算獎勵（老師發問時可為 0）
    mapping(uint256 => uint256) public questionCost;

    // 紀錄老師發行的 Prize NFT 資訊：價格與供應量
    struct PrizeNFTInfo {
        uint256 price; // 購買該 Prize NFT 所需的 PRIZE_TOKEN 數量
        uint256 supply; // 剩餘供應量
    }
    mapping(uint256 => PrizeNFTInfo) public prizeNFTs;

    // 各項數值設定（可根據需求調整）
    uint256 public constant INITIAL_STUDENT_TOKEN_AMOUNT = 100;
    // 學生發問時最少必須投入的 token 數量
    uint256 public constant MIN_QUESTION_COST = 10;
    // 好問題獎勵倍率：reward = stake * GOOD_QUESTION_MULTIPLIER
    uint256 public constant GOOD_QUESTION_MULTIPLIER = 5;
    // 普通問題獎勵倍率：reward = stake * AVERAGE_QUESTION_MULTIPLIER
    uint256 public constant AVERAGE_QUESTION_MULTIPLIER = 1;
    // 老師發起問題後，學生回答的固定獎勵
    uint256 public constant ANSWER_TEACHER_QUESTION_REWARD = 50;

    constructor(string memory uri) ERC1155(uri) {
        // 設定部署者為 admin 與預設老師
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TEACHER_ROLE, msg.sender);
    }

    /**
     * @notice Returns the token-specific URI for a given tokenId.
     * For example, if _baseURI is "https://api.example.com/metadata/"
     * and tokenId is 1000, then this function returns:
     * "https://api.example.com/metadata/1000.json"
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseURI, tokenId.toString(), ".json"));
    }

    /**
     * @notice 學生註冊，獲得初始的 STUDENT_TOKEN
     */
    function registerStudent() external {
        require(!registeredStudents[msg.sender], "Already registered");
        registeredStudents[msg.sender] = true;
        _mint(msg.sender, STUDENT_TOKEN, INITIAL_STUDENT_TOKEN_AMOUNT, "");
    }

    /**
     * @notice 學生發問，需投入一定數量的 STUDENT_TOKEN 並鑄造一個 Question NFT 給自己
     * @param stakeAmount 學生發問時投入的 token 數量，必須 >= MIN_QUESTION_COST
     *
     * 範例：學生呼叫 studentAskQuestion(20) ，投入 20 個 token 發問，
     * 系統銷毀 20 個 STUDENT_TOKEN、鑄造一個 Question NFT（例如 id = 1000）並記錄投入金額。
     */
    function studentAskQuestion(uint256 stakeAmount) external {
        require(registeredStudents[msg.sender], "Not registered");
        require(
            stakeAmount >= MIN_QUESTION_COST,
            "Stake below minimum requirement"
        );
        require(
            balanceOf(msg.sender, STUDENT_TOKEN) >= stakeAmount,
            "Not enough student token"
        );
        // 扣除學生投入的 token
        _burn(msg.sender, STUDENT_TOKEN, stakeAmount);
        // 鑄造 Question NFT 給學生
        uint256 newQuestionId = _questionCounter;
        _questionCounter++;
        _mint(msg.sender, newQuestionId, 1, "");
        // 記錄該問題的發起者與投入金額
        questionOwner[newQuestionId] = msg.sender;
        questionCost[newQuestionId] = stakeAmount;
    }

    /**
     * @notice 老師認為問題優秀：不銷毀問題 NFT
     *  若該 NFT 原屬於老師（老師提問），則轉移給回答學生；若屬於學生，則學生保留。
     *  同時鑄造 Answer NFT 並依學生投入金額發放獎勵（reward = stake * GOOD_QUESTION_MULTIPLIER）
     * @param student 學生地址（回答者）
     * @param questionId 該問題 NFT 的 id
     */
    function teacherApproveQuestion(
        address student,
        uint256 questionId
    ) external onlyRole(TEACHER_ROLE) {
        // 確認該 NFT 存在
        require(
            balanceOf(questionOwner[questionId], questionId) >= 1,
            "Question NFT not found"
        );
        uint256 stake = questionCost[questionId];
        // 如果問題 NFT原屬於老師，則轉移 NFT 給回答學生
        if (questionOwner[questionId] != student) {
            safeTransferFrom(
                questionOwner[questionId],
                student,
                questionId,
                1,
                ""
            );
            questionOwner[questionId] = student;
        }
        // 清除 stake 紀錄（若有）
        if (stake > 0) {
            delete questionCost[questionId];
        }
        // 鑄造 Answer NFT 給學生
        uint256 newAnswerId = _answerCounter;
        _answerCounter++;
        _mint(student, newAnswerId, 1, "");
        // 發放獎勵：僅對學生發問的情況才根據投入金額計算（老師提問 reward 為 0）
        uint256 reward = stake * GOOD_QUESTION_MULTIPLIER;
        if (reward > 0) {
            _mint(student, PRIZE_TOKEN, reward, "");
        }
    }

    /**
     * @notice 老師認為問題普通：不銷毀問題 NFT
     *  若該 NFT 原屬於老師，則轉移給回答學生；否則學生保留原有 NFT。
     *  同時計算獎勵 = stake * AVERAGE_QUESTION_MULTIPLIER
     * @param student 學生地址
     * @param questionId 該問題 NFT 的 id
     */
    function teacherModerateQuestion(
        address student,
        uint256 questionId
    ) external onlyRole(TEACHER_ROLE) {
        require(
            balanceOf(questionOwner[questionId], questionId) >= 1,
            "Question NFT not found"
        );
        uint256 stake = questionCost[questionId];
        if (questionOwner[questionId] != student) {
            safeTransferFrom(
                questionOwner[questionId],
                student,
                questionId,
                1,
                ""
            );
            questionOwner[questionId] = student;
        }
        if (stake > 0) {
            delete questionCost[questionId];
        }
        uint256 reward = stake * AVERAGE_QUESTION_MULTIPLIER;
        if (reward > 0) {
            _mint(student, PRIZE_TOKEN, reward, "");
        }
    }

    /**
     * @notice 老師認為問題爛：銷毀問題 NFT，不發放獎勵
     * @param questionId 該問題 NFT 的 id
     */
    function teacherRejectQuestion(
        uint256 questionId
    ) external onlyRole(TEACHER_ROLE) {
        require(
            balanceOf(questionOwner[questionId], questionId) >= 1,
            "Question NFT not found"
        );
        _burn(questionOwner[questionId], questionId, 1);
        delete questionOwner[questionId];
        delete questionCost[questionId];
    }

    /**
     * @notice 老師發起問題：鑄造一個 Question NFT 給老師自己（老師發問時不設定投入金額）
     */
    function teacherPostQuestion() external onlyRole(TEACHER_ROLE) {
        uint256 newQuestionId = _questionCounter;
        _questionCounter++;
        _mint(msg.sender, newQuestionId, 1, "");
        questionOwner[newQuestionId] = msg.sender;
        // 老師發問不記錄 stake（預設為 0）
    }

    /**
     * @notice 學生回答老師所發起的問題：
     *  不銷毀老師的 Question NFT，而是將其從老師轉移給學生，
     *  同時鑄造 Answer NFT 並發放固定獎勵。
     * @param questionId 該老師發起的 Question NFT 的 id
     */
    function studentAnswerTeacherQuestion(uint256 questionId) external {
        address poster = questionOwner[questionId];
        require(
            hasRole(TEACHER_ROLE, poster),
            "Question not posted by a teacher"
        );
        require(
            balanceOf(poster, questionId) >= 1,
            "Teacher does not own the question NFT"
        );
        // 將老師的 Question NFT 轉移給回答學生
        safeTransferFrom(poster, msg.sender, questionId, 1, "");
        questionOwner[questionId] = msg.sender;
        // 鑄造 Answer NFT 並發放固定獎勵
        uint256 newAnswerId = _answerCounter;
        _answerCounter++;
        _mint(msg.sender, newAnswerId, 1, "");
        _mint(msg.sender, PRIZE_TOKEN, ANSWER_TEACHER_QUESTION_REWARD, "");
    }

    /**
     * @notice 老師發行一種 Prize NFT，設定購買價格（以 PRIZE_TOKEN 計）與總供應量
     * @param price 需要消耗的 PRIZE_TOKEN 數量才能購買
     * @param supply 該 Prize NFT 的總供應量
     * @return newPrizeNFTId 該 Prize NFT 的 token id
     */
    function teacherIssuePrizeNFT(
        uint256 price,
        uint256 supply
    ) external onlyRole(TEACHER_ROLE) returns (uint256) {
        uint256 newPrizeNFTId = _prizeNFTCounter;
        _prizeNFTCounter++;
        prizeNFTs[newPrizeNFTId] = PrizeNFTInfo(price, supply);
        return newPrizeNFTId;
    }

    /**
     * @notice 學生使用 PRIZE_TOKEN 購買 Prize NFT
     * @param prizeNFTId 要購買的 Prize NFT token id
     */
    function purchasePrizeNFT(uint256 prizeNFTId) external {
        PrizeNFTInfo storage info = prizeNFTs[prizeNFTId];
        require(info.supply > 0, "Prize NFT sold out");
        require(
            balanceOf(msg.sender, PRIZE_TOKEN) >= info.price,
            "Not enough Prize Tokens"
        );
        _burn(msg.sender, PRIZE_TOKEN, info.price);
        _mint(msg.sender, prizeNFTId, 1, "");
        info.supply -= 1;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
