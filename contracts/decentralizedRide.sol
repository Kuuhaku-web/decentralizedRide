// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Decentralized Ride Sharing
 * @dev Smart Contract untuk tugas Ride Sharing Terdesentralisasi.
 * Memenuhi kriteria: Registrasi Driver, Pemesanan, Escrow Payment, dan Dokumentasi.
 */
contract DecentralizedRide {

    // --- 1. STATE VARIABLES & DATA STRUCTURE ---
    address public owner;
    uint256 public rideCounter;

    // Enum Status sesuai kriteria (Requested s/d Cancelled)
    enum RideStatus { 
        REQUESTED, 
        ACCEPTED, 
        FUNDED, 
        COMPLETED_BY_DRIVER, 
        FINALIZED, 
        CANCELLED 
    }

    struct Driver {
        bool isRegistered;
        string name;
        string licensePlate;
        string vehicleType;
        uint256 ratePerKm;
        address payable wallet;
    }

    struct Ride {
        uint256 id;
        address payable rider;
        address payable driver;
        string pickup;
        string dest;
        uint256 price;
        RideStatus status;
    }

    mapping(address => Driver) public drivers;
    mapping(uint256 => Ride) public rides;

    // --- 2. EVENTS (Log Transaksi Blockchain) ---
    event DriverRegistered(address indexed driver, string name);
    event RideRequested(uint256 indexed id, address indexed rider, uint256 price);
    event RideAccepted(uint256 indexed id, address indexed driver);
    event RideFunded(uint256 indexed id, uint256 amount);
    event RideCompleted(uint256 indexed id);
    event RideFinalized(uint256 indexed id, uint256 amount); // Dana cair ke driver
    event RideCancelled(uint256 indexed id);

    // --- 3. MODIFIERS (Validasi Keamanan) ---
    modifier onlyRegisteredDriver() {
        require(drivers[msg.sender].isRegistered, "Error: Anda bukan driver terdaftar");
        _;
    }

    modifier onlyRider(uint256 _id) {
        require(rides[_id].rider == msg.sender, "Error: Anda bukan pembuat order ini");
        _;
    }

    modifier onlyAssignedDriver(uint256 _id) {
        require(rides[_id].driver == msg.sender, "Error: Anda bukan driver yang mengambil order ini");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ==========================================================
    // BAGIAN A: DATA PENGEMUDI
    // ==========================================================

    /// @dev Mendaftarkan pengemudi baru ke sistem.
    /// @param _name Nama Driver
    /// @param _plate Plat Nomor
    /// @param _type Tipe Kendaraan
    /// @param _rate Tarif per KM (in Wei)
    function registerDriver(string memory _name, string memory _plate, string memory _type, uint256 _rate) public {
        require(!drivers[msg.sender].isRegistered, "Error: Wallet ini sudah terdaftar");
        
        drivers[msg.sender] = Driver({
            isRegistered: true,
            name: _name,
            licensePlate: _plate,
            vehicleType: _type,
            ratePerKm: _rate,
            wallet: payable(msg.sender)
        });
        emit DriverRegistered(msg.sender, _name);
    }

    /// @dev Melihat data pengemudi berdasarkan address.
    function getDriver(address _addr) public view returns (Driver memory) {
        return drivers[_addr];
    }

    // ==========================================================
    // BAGIAN B: PEMESANAN & BAGIAN C: ESCROW (ATURAN DANA)
    // ==========================================================

    /// @dev 1. Penumpang membuat order baru (Status: REQUESTED).
    function requestRide(string memory _pickup, string memory _dest, uint256 _price) public {
        rideCounter++;
        rides[rideCounter] = Ride({
            id: rideCounter,
            rider: payable(msg.sender),
            driver: payable(address(0)), // Driver belum ada
            pickup: _pickup,
            dest: _dest,
            price: _price,
            status: RideStatus.REQUESTED
        });
        emit RideRequested(rideCounter, msg.sender, _price);
    }

    /// @dev 2. Driver menerima order (Status: ACCEPTED).
    function acceptRide(uint256 _id) public onlyRegisteredDriver {
        Ride storage r = rides[_id];
        require(r.status == RideStatus.REQUESTED, "Error: Order tidak tersedia/sudah diambil");
        
        r.driver = payable(msg.sender);
        r.status = RideStatus.ACCEPTED;
        emit RideAccepted(_id, msg.sender);
    }

    /// @dev 3. Penumpang membayar ke Escrow/Contract (Status: FUNDED).
    /// @notice Uang ditahan di smart contract, belum dikirim ke driver.
    function fundRide(uint256 _id) public payable onlyRider(_id) {
        Ride storage r = rides[_id];
        require(r.status == RideStatus.ACCEPTED, "Error: Tunggu driver menerima order");
        require(msg.value == r.price, "Error: Jumlah pembayaran tidak sesuai");

        r.status = RideStatus.FUNDED;
        emit RideFunded(_id, msg.value);
    }

    /// @dev 4. Driver menyelesaikan perjalanan (Status: COMPLETED_BY_DRIVER).
    function completeRide(uint256 _id) public onlyAssignedDriver(_id) {
        require(rides[_id].status == RideStatus.FUNDED, "Error: Order belum dibayar (Funded)");
        rides[_id].status = RideStatus.COMPLETED_BY_DRIVER;
        emit RideCompleted(_id);
    }

    /// @dev 5. Konfirmasi Akhir & Pencairan Dana (Status: FINALIZED).
    /// @notice Dana dari Escrow baru ditransfer ke Driver di tahap ini.
    function confirmArrival(uint256 _id) public onlyRider(_id) {
        Ride storage r = rides[_id];
        require(r.status == RideStatus.COMPLETED_BY_DRIVER, "Error: Driver belum menyelesaikan perjalanan");
        
        r.status = RideStatus.FINALIZED;
        
        // Transfer dana aman (Escrow -> Driver)
        (bool success, ) = r.driver.call{value: r.price}("");
        require(success, "Error: Gagal transfer dana ke driver");
        
        emit RideFinalized(_id, r.price);
    }

    /// @dev Fitur Tambahan: Pembatalan & Refund (Sesuai Aturan Dana C).
    /// Jika status sudah FUNDED, uang dikembalikan ke Penumpang.
    function cancelRide(uint256 _id) public {
        Ride storage r = rides[_id];
        // Hanya Rider atau Driver ybs yang boleh cancel
        require(msg.sender == r.rider || msg.sender == r.driver, "Error: Tidak punya akses cancel");
        require(r.status == RideStatus.REQUESTED || r.status == RideStatus.ACCEPTED || r.status == RideStatus.FUNDED, "Error: Tidak bisa cancel di status ini");

        // Logika Refund: Kembalikan uang ke Rider jika sudah terlanjur masuk
        if (r.status == RideStatus.FUNDED) {
            (bool sent, ) = r.rider.call{value: r.price}("");
            require(sent, "Error: Gagal mengembalikan dana (refund)");
        }

        r.status = RideStatus.CANCELLED;
        emit RideCancelled(_id);
    }
}