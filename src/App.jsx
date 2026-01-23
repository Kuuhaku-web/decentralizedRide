import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Layout, Button, Card, Input, Table, Tag, message, Typography, Row, Col } from 'antd';
import { CarOutlined, UserAddOutlined, ReloadOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Text } = Typography;

// --- KONFIGURASI FINAL ---
// 1. Alamat Contract (Sudah disesuaikan dengan Etherscan Anda)
const CONTRACT_ADDRESS = "0xbd772beeD7568f6e550430E16aa4b7CE5eE145dE";

// 2. ABI (Disusun PERSIS sesuai Struct Ride di screenshot Anda)
const CONTRACT_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "rides",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "address", "name": "rider", "type": "address" },
      { "internalType": "address", "name": "driver", "type": "address" },
      { "internalType": "string", "name": "pickup", "type": "string" },
      { "internalType": "string", "name": "dest", "type": "string" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "uint8", "name": "status", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  { "inputs": [], "name": "rideCounter", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "_pickup", "type": "string" }, { "internalType": "string", "name": "_dest", "type": "string" }, { "internalType": "uint256", "name": "_price", "type": "uint256" }], "name": "requestRide", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }, { "internalType": "string", "name": "_plate", "type": "string" }, { "internalType": "string", "name": "_type", "type": "string" }, { "internalType": "uint256", "name": "_rate", "type": "uint256" }], "name": "registerDriver", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "acceptRide", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "fundRide", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "completeRide", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "confirmArrival", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

// URL Infura Sepolia (Backup jika belum connect wallet)
const INFURA_URL = "https://sepolia.infura.io/v3/6c1c4851a69949c0ae1c5a0f9f751f91";

function App() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rides, setRides] = useState([]);

  // State Form
  const [regForm, setRegForm] = useState({ name: '', plate: '', type: '', rate: '' });
  const [reqForm, setReqForm] = useState({ pickup: '', dest: '', price: '' });

  // 1. Load Data Function (Jantung Aplikasi)
  const loadRides = async (contractInstance) => {
    if (!contractInstance) return;
    setLoading(true);
    try {
      // Ambil counter
      const counter = await contractInstance.methods.rideCounter().call();
      console.log("Jumlah Data:", counter);

      const loadedRides = [];
      for (let i = 1; i <= Number(counter); i++) {
        // Ambil data struct per ID
        const ride = await contractInstance.methods.rides(i).call();
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
    } catch (error) {
      console.error("Gagal load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Connect Wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);

        // PENTING: Saat connect, kita pakai provider MetaMask (Pasti Sepolia)
        const instance = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        setContract(instance);
        message.success("Wallet Terhubung!");
      } catch (error) { message.error("Gagal connect wallet"); }
    } else { message.warning("Install MetaMask!"); }
  };

  // 3. Effect: Auto Load (Dual Mode)
  useEffect(() => {
    if (contract) {
      // Jika sudah connect wallet, pakai koneksi wallet (Lebih stabil)
      loadRides(contract);
    } else {
      // Jika belum connect, coba pakai Infura (Mode Intip)
      try {
        const web3Infura = new Web3(INFURA_URL);
        const contractInfura = new web3Infura.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        loadRides(contractInfura);
      } catch (e) { console.log("Infura belum siap (Abaikan jika error merah)"); }
    }
  }, [contract]);

  // 4. Fungsi Transaksi
  const handleRegister = async () => {
    if (!contract) return message.warning("Connect Wallet dulu!");
    try { setLoading(true); await contract.methods.registerDriver(regForm.name, regForm.plate, regForm.type, regForm.rate).send({ from: account }); message.success("Berhasil Daftar!"); } catch (e) { message.error(e.message); } finally { setLoading(false); }
  };
  const handleRequest = async () => {
    if (!contract) return message.warning("Connect Wallet dulu!");
    try { setLoading(true); await contract.methods.requestRide(reqForm.pickup, reqForm.dest, reqForm.price).send({ from: account }); message.success("Berhasil Request!"); loadRides(contract); } catch (e) { message.error(e.message); } finally { setLoading(false); }
  };
  const handleAction = async (method, id, val = 0) => {
    if (!contract) return message.warning("Connect Wallet dulu!");
    try { setLoading(true); await contract.methods[method](id).send({ from: account, value: val }); message.success("Sukses!"); loadRides(contract); } catch (e) { message.error(e.message); } finally { setLoading(false); }
  };

  // Kolom Tabel
  const columns = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: 'Rute', render: (_, r) => `${r.pickup} ➝ ${r.dest}` },
    { title: 'Harga', dataIndex: 'price', render: p => `${p} Wei` },
    { title: 'Status', dataIndex: 'status', render: s => <Tag color="blue">{['REQ', 'ACC', 'FUND', 'COMP', 'DONE', 'CANC'][s]}</Tag> },
    {
      title: 'Aksi', render: (_, r) => (
        <div style={{ display: 'flex', gap: 5 }}>
          {r.status === 0 && <Button size="small" type="primary" onClick={() => handleAction('acceptRide', r.id)}>Accept</Button>}
          {r.status === 1 && <Button size="small" style={{ background: '#faad14' }} onClick={() => handleAction('fundRide', r.id, r.price)}>Fund</Button>}
          {r.status === 2 && <Button size="small" onClick={() => handleAction('completeRide', r.id)}>Complete</Button>}
          {r.status === 3 && <Button size="small" type="primary" style={{ background: '#52c41a' }} onClick={() => handleAction('confirmArrival', r.id)}>Confirm</Button>}
          {r.status === 4 && <Text type="success">✅</Text>}
        </div>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}><CarOutlined /> Ride App</div>
        {!account ? <Button type="primary" onClick={connectWallet}>Connect Wallet</Button> : <Tag color="green">{account.slice(0, 6)}...</Tag>}
      </Header>
      <Content style={{ padding: 20 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Card title={<span><UserAddOutlined /> Register Driver</span>}>
              <Input placeholder="Nama" onChange={e => setRegForm({ ...regForm, name: e.target.value })} style={{ marginBottom: 10 }} />
              <Input placeholder="Plat" onChange={e => setRegForm({ ...regForm, plate: e.target.value })} style={{ marginBottom: 10 }} />
              <Input placeholder="Mobil" onChange={e => setRegForm({ ...regForm, type: e.target.value })} style={{ marginBottom: 10 }} />
              <Input placeholder="Rate" type="number" onChange={e => setRegForm({ ...regForm, rate: e.target.value })} style={{ marginBottom: 10 }} />
              <Button type="primary" block onClick={handleRegister} loading={loading}>Daftar</Button>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Request Ride">
              <Input placeholder="Pickup" onChange={e => setReqForm({ ...reqForm, pickup: e.target.value })} style={{ marginBottom: 10 }} />
              <Input placeholder="Tujuan" onChange={e => setReqForm({ ...reqForm, dest: e.target.value })} style={{ marginBottom: 10 }} />
              <Input placeholder="Harga" type="number" onChange={e => setReqForm({ ...reqForm, price: e.target.value })} style={{ marginBottom: 10 }} />
              <Button block onClick={handleRequest} loading={loading}>Request</Button>
            </Card>
          </Col>
          <Col span={24} style={{ marginTop: 20 }}>
            <Card title="Daftar Perjalanan" extra={<Button icon={<ReloadOutlined />} onClick={() => loadRides(contract)}>Refresh</Button>}>
              <Table dataSource={rides} columns={columns} pagination={{ pageSize: 5 }} rowKey="key" />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default App;