// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Import OpenZeppelin contracts for ERC1155 and AccessControl
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract CourseBidding is ERC1155, AccessControl, ERC1155Holder {
    // Define a teacher role using a unique identifier
    bytes32 public constant TEACHER_ROLE = keccak256("TEACHER_ROLE");
    uint256 public constant CREDIT = 0;
    uint public courseCounter; // Counter for course IDs

    // Structure to store each bid
    struct Bid {
        address bidder;
        uint256 bidAmount;
    }

    // Structure to hold course details
    struct Course {
        uint courseId;
        address teacher;
        uint capacity; // n (名額上限)
        bool biddingActive; // true if bidding is open
        bool finalized; // true after finalization
        Bid[] bids; // List of bids for the course
        address[] winners; // Winning student addresses
        string metadataURI; // URI for course metadata
    }

    // Mapping from courseId to course details
    mapping(uint => Course) public courses;

    // Student registration and credit management
    mapping(address => bool) public registered;

    uint public initialCredit = 25 ether; // based credits

    // List of all course IDs for query purposes
    uint[] public courseIds;

    string public name;

    // Constructor sets the base URI for the ERC1155 tokens and assigns the deployer as admin
    constructor()
        ERC1155(
            "ipfs://bafkreiaar6nwcee74hjgpugvdax6kqfdslrjsknxlidv3w24vahea3ffqe"
        )
    {
        name = unicode"開學後網路加退選系統(四機)";
        // The deployer gets the DEFAULT_ADMIN_ROLE which allows managing roles.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _mint(address(this), CREDIT, (10 ** 30) * (10 ** 18), "");
        // Optionally, the deployer can also be granted the teacher role:
        _grantRole(TEACHER_ROLE, msg.sender);
    }

    function contractURI() public pure returns (string memory) {
        return
            "https://blue-binding-stoat-875.mypinata.cloud/ipfs/bafkreihyyi2st3kulxevtkpvxngyvepcxvy4n2i4756myahq2nguiwte4u.json";
    }

    // --------------------------------------
    // 1. Student Registration
    // --------------------------------------
    // 學生藉由註冊得到該學期的 credit
    function register() public {
        require(!registered[msg.sender], "Already registered");
        registered[msg.sender] = true;
        // transfer
        uint256[] memory ids = new uint256[](1);
        uint256[] memory values = new uint256[](1);
        ids[0] = CREDIT;
        values[0] = initialCredit;
        _updateWithAcceptanceCheck(address(this), msg.sender, ids, values, "");
    }

    // --------------------------------------
    // 2. Course Creation by Teacher
    // --------------------------------------
    // Only addresses with the TEACHER_ROLE can call this function.
    // 教師鑄造 n 個該堂課的 NFT (作為入場券)
    function createCourse(
        uint capacity,
        string memory metadataURI
    ) public onlyRole(TEACHER_ROLE) {
        require(capacity > 0, "Capacity must be > 0");
        courseCounter++;
        Course storage newCourse = courses[courseCounter];
        newCourse.courseId = courseCounter;
        newCourse.teacher = msg.sender;
        newCourse.capacity = capacity;
        newCourse.biddingActive = true;
        newCourse.finalized = false;
        newCourse.metadataURI = metadataURI;
        courseIds.push(courseCounter);

        // Mint the NFT tokens to the contract itself so it can distribute them later.
        _mint(address(this), courseCounter, capacity, "");
    }

    // --------------------------------------
    // 3. Bidding Process
    // --------------------------------------
    // 學生向自己想選的課程進行出價
    function bid(uint courseId, uint bidAmount) public {
        require(registered[msg.sender], "Not registered");
        Course storage course = courses[courseId];
        require(course.biddingActive, "Bidding is not active");
        // Check if student has enough credit to bid
        require(
            balanceOf(msg.sender, CREDIT) >= bidAmount,
            "Not enough credit"
        );

        // Deduct the bid amount from the student's credit (credit is "locked" in the bid)
        safeTransferFrom(msg.sender, address(this), CREDIT, bidAmount, "");
        // check the student have bid ever, if yes, raise the value
        for (uint i = 0; i < course.bids.length; i++) {
            if (course.bids[i].bidder == msg.sender) {
                course.bids[i].bidAmount = course.bids[i].bidAmount + bidAmount;
                return;
            }
        }
        course.bids.push(Bid({bidder: msg.sender, bidAmount: bidAmount}));
    }

    // --------------------------------------
    // 4. Finalizing the Bidding
    // --------------------------------------
    // Only a teacher can finalize the bidding for their own course.
    // 當教師手動截止時，合約自動選出最高出價的前 n 個學生，並發送 NFT 作為上課資格
    function finalizeBidding(uint courseId) public onlyRole(TEACHER_ROLE) {
        Course storage course = courses[courseId];
        require(
            msg.sender == course.teacher,
            "Only course teacher can finalize"
        );
        require(course.biddingActive, "Bidding already ended");
        course.biddingActive = false;
        course.finalized = true;

        // Sort the bids array in descending order of bidAmount (inefficient for large arrays)
        uint n = course.bids.length;
        uint i = 0;
        for (i = 0; i < n; i++) {
            for (uint j = i + 1; j < n; j++) {
                if (course.bids[j].bidAmount > course.bids[i].bidAmount) {
                    Bid memory temp = course.bids[i];
                    course.bids[i] = course.bids[j];
                    course.bids[j] = temp;
                }
            }
        }

        // Determine number of winners based on the course capacity
        uint winnersCount = course.capacity;
        if (n < winnersCount) {
            winnersCount = n;
        }
        i = 0;
        // Transfer one NFT to each winning bidder
        uint256[] memory ids = new uint256[](1);
        uint256[] memory values = new uint256[](1);
        ids[0] = courseId;
        values[0] = 1;

        for (i = 0; i < winnersCount; i++) {
            course.winners.push(course.bids[i].bidder);
            _updateWithAcceptanceCheck(
                address(this),
                course.bids[i].bidder,
                ids,
                values,
                ""
            );
        }

        ids[0] = CREDIT;
        // Give back crdits for losers
        for (; i < n; i++) {
            values[0] = course.bids[i].bidAmount;
            _updateWithAcceptanceCheck(
                address(this),
                course.bids[i].bidder,
                ids,
                values,
                ""
            );
        }
    }

    // --------------------------------------
    // 5. Query Functions for Transparency
    // --------------------------------------
    // Get a list of courses that are still accepting bids
    function getActiveCourses() public view returns (uint[] memory) {
        uint count = 0;
        for (uint i = 0; i < courseIds.length; i++) {
            if (courses[courseIds[i]].biddingActive) {
                count++;
            }
        }
        uint[] memory activeCourses = new uint[](count);
        uint index = 0;
        for (uint i = 0; i < courseIds.length; i++) {
            if (courses[courseIds[i]].biddingActive) {
                activeCourses[index] = courseIds[i];
                index++;
            }
        }
        return activeCourses;
    }

    // Get a list of courses that have ended bidding
    function getFinalizedCourses() public view returns (uint[] memory) {
        uint count = 0;
        for (uint i = 0; i < courseIds.length; i++) {
            if (courses[courseIds[i]].finalized) {
                count++;
            }
        }
        uint[] memory finalizedCourses = new uint[](count);
        uint index = 0;
        for (uint i = 0; i < courseIds.length; i++) {
            if (courses[courseIds[i]].finalized) {
                finalizedCourses[index] = courseIds[i];
                index++;
            }
        }
        return finalizedCourses;
    }

    // Retrieve the list of winning students for a finalized course
    function getWinners(uint courseId) public view returns (address[] memory) {
        Course storage course = courses[courseId];
        require(course.finalized, "Course not finalized yet");
        return course.winners;
    }

    // Retrieve all bids for a given course (for transparency)
    function getBids(
        uint courseId
    ) public view returns (address[] memory, uint[] memory) {
        Course storage course = courses[courseId];
        uint len = course.bids.length;
        address[] memory bidders = new address[](len);
        uint[] memory bidAmounts = new uint[](len);
        for (uint i = 0; i < len; i++) {
            bidders[i] = course.bids[i].bidder;
            bidAmounts[i] = course.bids[i].bidAmount;
        }
        return (bidders, bidAmounts);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC1155, AccessControl, ERC1155Holder)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
