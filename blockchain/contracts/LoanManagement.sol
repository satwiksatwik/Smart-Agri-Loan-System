// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LoanManagement {

    // ==================== STRUCTS ====================

    struct Loan {
        uint256 loanId;
        string borrowerName;
        string applicationNumber;
        uint256 amount;
        uint256 creditScore;
        string loanType;
        uint256 interestRate;    // basis points (e.g., 850 = 8.50%)
        bool approved;
        bool rejected;
        uint256 timestamp;
        string rejectionReason;
    }

    struct Repayment {
        uint256 loanId;
        uint256 amount;
        uint256 timestamp;
        uint256 emiNumber;
    }

    struct TransactionLog {
        uint256 loanId;
        string action;          // "CREATED", "APPROVED", "REJECTED", "EMI_PAID"
        uint256 timestamp;
        string details;
    }

    // ==================== STATE ====================

    uint256 public loanCount;
    uint256 public transactionCount;

    mapping(uint256 => Loan) public loans;
    mapping(uint256 => Repayment[]) public repayments;
    TransactionLog[] public transactionLogs;

    address public owner;

    // ==================== EVENTS ====================

    event LoanCreated(
        uint256 indexed loanId,
        string borrowerName,
        string applicationNumber,
        uint256 amount,
        uint256 creditScore,
        uint256 timestamp
    );

    event LoanApproved(
        uint256 indexed loanId,
        uint256 amount,
        uint256 interestRate,
        uint256 timestamp
    );

    event LoanRejected(
        uint256 indexed loanId,
        string reason,
        uint256 timestamp
    );

    event EMIRecorded(
        uint256 indexed loanId,
        uint256 amount,
        uint256 emiNumber,
        uint256 timestamp
    );

    // ==================== MODIFIERS ====================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    // ==================== CONSTRUCTOR ====================

    constructor() {
        owner = msg.sender;
        loanCount = 0;
        transactionCount = 0;
    }

    // ==================== FUNCTIONS ====================

    /// @notice Create a new loan application on-chain
    function createLoan(
        string memory _borrowerName,
        string memory _applicationNumber,
        uint256 _amount,
        uint256 _creditScore,
        string memory _loanType
    ) public onlyOwner returns (uint256) {
        loanCount++;

        loans[loanCount] = Loan({
            loanId: loanCount,
            borrowerName: _borrowerName,
            applicationNumber: _applicationNumber,
            amount: _amount,
            creditScore: _creditScore,
            loanType: _loanType,
            interestRate: 0,
            approved: false,
            rejected: false,
            timestamp: block.timestamp,
            rejectionReason: ""
        });

        // Log transaction
        transactionLogs.push(TransactionLog({
            loanId: loanCount,
            action: "CREATED",
            timestamp: block.timestamp,
            details: string(abi.encodePacked("Loan created for ", _borrowerName))
        }));
        transactionCount++;

        emit LoanCreated(
            loanCount,
            _borrowerName,
            _applicationNumber,
            _amount,
            _creditScore,
            block.timestamp
        );

        return loanCount;
    }

    /// @notice Approve a loan
    function approveLoan(
        uint256 _loanId,
        uint256 _interestRate
    ) public onlyOwner {
        require(_loanId > 0 && _loanId <= loanCount, "Invalid loan ID");
        require(!loans[_loanId].approved && !loans[_loanId].rejected, "Loan already processed");

        loans[_loanId].approved = true;
        loans[_loanId].interestRate = _interestRate;

        transactionLogs.push(TransactionLog({
            loanId: _loanId,
            action: "APPROVED",
            timestamp: block.timestamp,
            details: "Loan approved by bank manager"
        }));
        transactionCount++;

        emit LoanApproved(_loanId, loans[_loanId].amount, _interestRate, block.timestamp);
    }

    /// @notice Reject a loan
    function rejectLoan(
        uint256 _loanId,
        string memory _reason
    ) public onlyOwner {
        require(_loanId > 0 && _loanId <= loanCount, "Invalid loan ID");
        require(!loans[_loanId].approved && !loans[_loanId].rejected, "Loan already processed");

        loans[_loanId].rejected = true;
        loans[_loanId].rejectionReason = _reason;

        transactionLogs.push(TransactionLog({
            loanId: _loanId,
            action: "REJECTED",
            timestamp: block.timestamp,
            details: _reason
        }));
        transactionCount++;

        emit LoanRejected(_loanId, _reason, block.timestamp);
    }

    /// @notice Record an EMI repayment
    function recordRepayment(
        uint256 _loanId,
        uint256 _amount,
        uint256 _emiNumber
    ) public onlyOwner {
        require(_loanId > 0 && _loanId <= loanCount, "Invalid loan ID");
        require(loans[_loanId].approved, "Loan not approved");

        repayments[_loanId].push(Repayment({
            loanId: _loanId,
            amount: _amount,
            timestamp: block.timestamp,
            emiNumber: _emiNumber
        }));

        transactionLogs.push(TransactionLog({
            loanId: _loanId,
            action: "EMI_PAID",
            timestamp: block.timestamp,
            details: string(abi.encodePacked("EMI #", _uintToString(_emiNumber), " paid"))
        }));
        transactionCount++;

        emit EMIRecorded(_loanId, _amount, _emiNumber, block.timestamp);
    }

    /// @notice Get a single loan
    function getLoan(uint256 _loanId) public view returns (Loan memory) {
        require(_loanId > 0 && _loanId <= loanCount, "Invalid loan ID");
        return loans[_loanId];
    }

    /// @notice Get all loans
    function getAllLoans() public view returns (Loan[] memory) {
        Loan[] memory allLoans = new Loan[](loanCount);
        for (uint256 i = 1; i <= loanCount; i++) {
            allLoans[i - 1] = loans[i];
        }
        return allLoans;
    }

    /// @notice Get repayments for a loan
    function getRepayments(uint256 _loanId) public view returns (Repayment[] memory) {
        return repayments[_loanId];
    }

    /// @notice Get all transaction logs
    function getTransactionHistory() public view returns (TransactionLog[] memory) {
        return transactionLogs;
    }

    /// @notice Get transaction count
    function getTransactionCount() public view returns (uint256) {
        return transactionCount;
    }

    // ==================== HELPERS ====================

    function _uintToString(uint256 _value) internal pure returns (string memory) {
        if (_value == 0) return "0";
        uint256 temp = _value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (_value % 10)));
            _value /= 10;
        }
        return string(buffer);
    }
}
