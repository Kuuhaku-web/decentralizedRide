import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Layout, Button, Card, Input, Table, Tag, message, Typography, Row, Col } from 'antd';
import { CarOutlined, WalletOutlined, UserAddOutlined, ReloadOutlined } from '@ant-design/icons';


const { Header, Content } = Layout;
const { Text } = Typography;

// --- KONFIGURASI KONTRAK (WAJIB DIISI) ---
// 1. Ganti dengan Address Kontrak Anda dari Remix
const CONTRACT_ADDRESS = "0x358AA13c52544ECCEF6B0ADD0f801012ADAD5eE3";

// 2. Ganti dengan ABI Anda dari Remix (Paste Full JSON di sini)
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "acceptRide",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "cancelRide",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "completeRide",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "confirmArrival",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_plate",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_type",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_rate",
        "type": "uint256"
      }
    ],
    "name": "registerDriver",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "driver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "DriverRegistered",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "fundRide",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_pickup",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_dest",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_price",
        "type": "uint256"
      }
    ],
    "name": "requestRide",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "driver",
        "type": "address"
      }
    ],
    "name": "RideAccepted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "RideCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "RideCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "RideFinalized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "RideFunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "rider",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "RideRequested",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "drivers",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isRegistered",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "licensePlate",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "vehicleType",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "ratePerKm",
        "type": "uint256"
      },
      {
        "internalType": "address payable",
        "name": "wallet",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_addr",
        "type": "address"
      }
    ],
    "name": "getDriver",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bool",
            "name": "isRegistered",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "licensePlate",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "vehicleType",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "ratePerKm",
            "type": "uint256"
          },
          {
            "internalType": "address payable",
            "name": "wallet",
            "type": "address"
          }
        ],
        "internalType": "struct DecentralizedRide.Driver",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rideCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "rides",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "address payable",
        "name": "rider",
        "type": "address"
      },
      {
        "internalType": "address payable",
        "name": "driver",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "pickup",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "dest",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "enum DecentralizedRide.RideStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }

];

// TAMBAHAN 1: Paste URL Infura Anda di sini
const INFURA_URL = "https://sepolia.infura.io/v3/6c1c4851a69949c0ae1c5a0f9f751f91";

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rides, setRides] = useState([]);
  const [regForm, setRegForm] = useState({ name: '', plate: '', type: '', rate: '' });
  const [reqForm, setReqForm] = useState({ pickup: '', dest: '', price: '' });

  // 1. KONEKSI KE WALLET
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWeb3(web3Instance);
        setAccount(accounts[0]);

        const contractInstance = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        setContract(contractInstance);
        message.success("Wallet Terhubung!");
      } catch (error) {
        message.error("Gagal connect wallet");
      }
    } else {
      message.warning("Install MetaMask dulu!");
    }
  };

  // 2. LOAD DATA
  const loadRides = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const counter = await contract.methods.rideCounter().call();
      const loadedRides = [];
      for (let i = 1; i <= Number(counter); i++) {
        const ride = await contract.methods.rides(i).call();
        loadedRides.push({
          key: i,
          id: ride.id.toString(),
          pickup: ride.pickup,
          dest: ride.dest,
          price: ride.price.toString(),
          status: Number(ride.status),
        });
      }
      setRides(loadedRides);
      message.success("Data diperbarui");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // --- MODIFIKASI: Load Data Awal Pakai Infura ---
  useEffect(() => {
    const initData = async () => {
      // Skenario 1: Jika user sudah connect wallet (pakai MetaMask)
      if (contract) {
        loadRides();
      }
      // Skenario 2: Jika BELUM connect wallet (pakai Infura buat intip data)
      else {
        try {
          // Bikin koneksi "mata-mata" (Read Only) lewat Infura
          const web3Infura = new Web3(INFURA_URL);
          const contractInfura = new web3Infura.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

          // Ambil data counter
          const counter = await contractInfura.methods.rideCounter().call();
          const loadedRides = [];

          // Loop data satu per satu
          for (let i = 1; i <= Number(counter); i++) {
            const ride = await contractInfura.methods.rides(i).call();
            loadedRides.push({
              key: i,
              id: ride.id.toString(),
              pickup: ride.pickup,
              dest: ride.dest,
              price: ride.price.toString(),
              status: Number(ride.status),
            });
          }
          setRides(loadedRides); // Tampilkan di tabel
          console.log("Data loaded via Infura (Read-Only Mode)");
        } catch (err) {
          console.log("Gagal load Infura:", err);
        }
      }
    };

    initData();
  }, [contract]); // Jalan setiap kali status kontrak berubah

  // 3. FUNGSI TRANSAKSI
  const handleRegister = async () => {
    try {
      setLoading(true);
      await contract.methods.registerDriver(regForm.name, regForm.plate, regForm.type, regForm.rate).send({ from: account });
      message.success("Registrasi Berhasil!");
    } catch (err) { message.error("Gagal: " + err.message); } finally { setLoading(false); }
  };

  const handleRequest = async () => {
    try {
      setLoading(true);
      await contract.methods.requestRide(reqForm.pickup, reqForm.dest, reqForm.price).send({ from: account });
      message.success("Order Dibuat!");
      loadRides();
    } catch (err) { message.error("Gagal: " + err.message); } finally { setLoading(false); }
  };

  const handleAction = async (methodName, id, value = 0) => {
    try {
      setLoading(true);
      const params = { from: account };
      if (value > 0) params.value = value;
      await contract.methods[methodName](id).send(params);
      message.success(`Aksi ${methodName} sukses!`);
      loadRides();
    } catch (err) { message.error("Gagal: " + err.message); } finally { setLoading(false); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: 'Rute', render: (_, r) => `${r.pickup} ➝ ${r.dest}` },
    { title: 'Harga (Wei)', dataIndex: 'price' },
    {
      title: 'Status', dataIndex: 'status',
      render: (s) => <Tag color={['default', 'processing', 'warning', 'blue', 'success', 'error'][s]}>{['REQUESTED', 'ACCEPTED', 'FUNDED', 'COMPLETED', 'FINALIZED', 'CANCELLED'][s]}</Tag>
    },
    {
      title: 'Aksi',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: '5px' }}>
          {r.status === 0 && <Button size="small" type="primary" onClick={() => handleAction('acceptRide', r.id)}>Accept</Button>}
          {r.status === 1 && <Button size="small" style={{ background: '#faad14', color: 'white' }} onClick={() => handleAction('fundRide', r.id, r.price)}>Fund</Button>}
          {r.status === 2 && <Button size="small" type="primary" ghost onClick={() => handleAction('completeRide', r.id)}>Complete</Button>}
          {r.status === 3 && <Button size="small" type="primary" style={{ background: '#52c41a' }} onClick={() => handleAction('confirmArrival', r.id)}>Confirm</Button>}
          {r.status === 4 && <Text type="success">✅ Selesai</Text>}
        </div>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}><CarOutlined /> Ride App</div>
        {!account ? <Button type="primary" onClick={connectWallet}>Connect Wallet</Button> : <Tag color="green">{account.substring(0, 6)}...</Tag>}
      </Header>
      <Content style={{ padding: '20px 50px' }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title={<span><UserAddOutlined /> Register Driver</span>}>
              <Input placeholder="Nama" style={{ marginBottom: 10 }} onChange={e => setRegForm({ ...regForm, name: e.target.value })} />
              <Input placeholder="Plat" style={{ marginBottom: 10 }} onChange={e => setRegForm({ ...regForm, plate: e.target.value })} />
              <Input placeholder="Tipe" style={{ marginBottom: 10 }} onChange={e => setRegForm({ ...regForm, type: e.target.value })} />
              <Input placeholder="Rate" type="number" style={{ marginBottom: 10 }} onChange={e => setRegForm({ ...regForm, rate: e.target.value })} />
              <Button type="primary" block onClick={handleRegister} loading={loading}>Daftar</Button>
            </Card>
          </Col>
          <Col span={12}>
            <Card title={<span><CarOutlined /> Request Ride</span>}>
              <Input placeholder="Pickup" style={{ marginBottom: 10 }} onChange={e => setReqForm({ ...reqForm, pickup: e.target.value })} />
              <Input placeholder="Dest" style={{ marginBottom: 10 }} onChange={e => setReqForm({ ...reqForm, dest: e.target.value })} />
              <Input placeholder="Price" type="number" style={{ marginBottom: 10 }} onChange={e => setReqForm({ ...reqForm, price: e.target.value })} />
              <Button type="dashed" block onClick={handleRequest} loading={loading}>Request</Button>
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Daftar Perjalanan" extra={<Button icon={<ReloadOutlined />} onClick={loadRides}>Refresh</Button>}>
              <Table dataSource={rides} columns={columns} loading={loading} pagination={{ pageSize: 5 }} />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default App;