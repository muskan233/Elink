import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// TOR API CONFIG
const TOR_BASE_URL = 'https://torapis.tor-iot.com';
const TOR_USER = 'muskan@omegaseikimobility.com';
const TOR_PASS = 'Muski@12';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- DATABASE MODELS ---
const TelemetrySchema = new mongoose.Schema({
  timestamp: { type: String, index: true },
  rawTor: Object,
  metrics: Object
}, { _id: false });

const VehicleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true }, 
  displayDeviceId: String,
  chassisNumber: String,
  registrationNo: String,
  status: String,
  location: { lat: Number, lng: Number },
  metrics: Object,
  equipmentConfig: Object,
  lastUpdate: Date,
  history: [TelemetrySchema]
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Admin' }
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
const User = mongoose.model('User', UserSchema);

// --- INTEGRATED DATA BRIDGE ---
let torAuthToken = null;

const loginToTor = async () => {
  try {
    const res = await axios.post(`${TOR_BASE_URL}/Auth/login`, { username: TOR_USER, password: TOR_PASS });
    torAuthToken = res.data?.token || res.data?.data?.token || res.data?.result?.token;
    return !!torAuthToken;
  } catch (e) { return false; }
};

const runDataBridge = async () => {
  if (!torAuthToken && !(await loginToTor())) return;
  try {
    const meta = await axios.post(`${TOR_BASE_URL}/EquipDetails/GetVehicleDetails`, { pageNo: 1, pageSize: 2000 }, { headers: { 'Authorization': `Bearer ${torAuthToken}` } });
    const live = await axios.post(`${TOR_BASE_URL}/MachineData/GetLatestMachineData`, { pageNo: 1, pageSize: 2000 }, { headers: { 'Authorization': `Bearer ${torAuthToken}` } });

    const liveData = live.data?.data || live.data?.result || [];
    const metaData = meta.data?.data || meta.data?.result || [];
    const metaMap = new Map(metaData.map(m => [String(m.HWID || m.hardwareId).trim(), m]));

    for (const v of liveData) {
      const hwid = String(v.HWID || v.hardwareId).trim();
      if (!hwid) continue;
      const m = metaMap.get(hwid) || {};
      const node = {
        id: hwid,
        displayDeviceId: m.equipmentCode || hwid,
        chassisNumber: m.vehicleChassisNo || '---',
        registrationNo: m.vehicleRegNo || '---',
        status: v.MachineStatus || 'Off',
        location: { lat: parseFloat(v.Latitude || 0), lng: parseFloat(v.Longitude || 0) },
        metrics: {
          batteryLevel: parseFloat(v.StateofCharge || 0),
          speed: parseFloat(v.Speed || 0),
          totalKm: parseFloat(v.Odometer || 0),
          voltage: parseFloat(v.BatteryVoltage || 0),
          temp: parseFloat(v.BatteryTemp || 0)
        },
        equipmentConfig: m
      };
      await Vehicle.findOneAndUpdate(
        { id: hwid }, 
        { $set: { ...node, lastUpdate: new Date() }, 
          $addToSet: { history: { $each: [{ timestamp: v.ENTRYDATE || new Date().toISOString(), rawTor: v, metrics: node.metrics }], $position: 0, $slice: 500 } } 
        }, 
        { upsert: true }
      );
    }
  } catch (e) {
    if (e.response?.status === 401) torAuthToken = null;
  }
};

// --- API ROUTES ---
app.get('/api/vehicles', async (req, res) => res.json(await Vehicle.find({}, '-history')));
app.get('/api/telemetry/:id', async (req, res) => res.json(await Vehicle.findOne({ id: req.params.id })));
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  res.json(user ? { success: true, user } : { success: false });
});

// --- SERVE STATIC FRONTEND ---
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Health check
app.get('/health', (req, res) => res.sendStatus(200));

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// --- INIT ---
if (!MONGODB_URI) {
  console.error("FATAL: MONGODB_URI is not defined.");
  process.exit(1);
}

mongoose.connect(MONGODB_URI).then(() => {
  console.log("Connected to MongoDB.");
  app.listen(port, '0.0.0.0', () => {
    console.log(`Unified Server running on port ${port}`);
    // Seed admin
    User.updateOne({ username: 'admin' }, { $setOnInsert: { username: 'admin', password: 'admin', role: 'Admin' } }, { upsert: true }).exec();
    
    // Start Bridge
    runDataBridge();
    setInterval(runDataBridge, 60000); 
  });
});
