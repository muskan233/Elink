
import axios from 'axios';

// Set this to your live Render/Heroku URL in production
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const BULK_URL = `${BACKEND_URL}/api/telemetry/bulk`; 
const TOR_BASE_URL = 'https://torapis.tor-iot.com';

const USERNAME = 'muskan@omegaseikimobility.com';
const PASSWORD = 'Muski@12'; 

let authToken = null;

const getVal = (obj, targetKeys, fallback = null) => {
  if (!obj) return fallback;
  for (const tk of targetKeys) {
    if (obj[tk] !== undefined && obj[tk] !== null) return obj[tk];
  }
  return fallback;
};

const loginToTor = async () => {
  try {
    console.log(`[BRIDGE] 🔑 Authenticating with TOR...`);
    const res = await axios.post(`${TOR_BASE_URL}/Auth/login`, { username: USERNAME, password: PASSWORD }, { timeout: 15000 });
    const token = res.data?.token || res.data?.data?.token || res.data?.result?.token;
    if (token) {
      authToken = token;
      console.log(`[BRIDGE] ✅ Authentication Successful.`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`[BRIDGE] ❌ Auth Error:`, err.message);
    return false;
  }
};

const fetchAllPages = async (endpoint, basePayload) => {
  let allData = [];
  let pageNo = 1;
  let hasMore = true;
  const pageSize = 1000;

  while (hasMore) {
    try {
      console.log(`[BRIDGE] 📥 Fetching ${endpoint} (Page ${pageNo})...`);
      const res = await axios.post(
        `${TOR_BASE_URL}${endpoint}`,
        { ...basePayload, pageNo, pageSize },
        { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 60000 }
      );

      const rawList = res.data?.data || res.data?.result || res.data || [];
      const list = Array.isArray(rawList) ? rawList : (rawList.data || []);

      if (list.length > 0) {
        allData = allData.concat(list);
        if (list.length < pageSize) {
          hasMore = false;
        } else {
          pageNo++;
        }
      } else {
        hasMore = false;
      }
    } catch (err) {
      console.error(`[BRIDGE] ❌ Error on page ${pageNo}:`, err.message);
      hasMore = false;
    }
  }
  return allData;
};

const fetchAndForward = async () => {
  if (!authToken) {
    if (!(await loginToTor())) return;
  }

  try {
    console.log(`[BRIDGE] 📡 Starting Fleet Sync... Target: ${BACKEND_URL}`);
    const metaDataList = await fetchAllPages('/EquipDetails/GetVehicleDetails', { hardwareId: "", equipmentCode: "" });
    
    const metaMap = new Map();
    metaDataList.forEach(m => {
        const hwid = String(getVal(m, ['HWID', 'hardwareId'], '')).trim();
        if (hwid) metaMap.set(hwid, m);
    });

    const telemetryList = await fetchAllPages('/MachineData/GetLatestMachineData', { hardwareId: "", equipmentCode: "" });
    console.log(`[BRIDGE] 📥 Final Sync Count: ${telemetryList.length} nodes.`);

    if (telemetryList.length === 0) return;

    const batch = [];
    for (const v of telemetryList) {
      const hwid = String(getVal(v, ['HWID', 'hardwareId'], '')).trim();
      if (!hwid) continue;

      const meta = metaMap.get(hwid) || {};
      
      batch.push({
        id: hwid, 
        displayDeviceId: getVal(meta, ['equipmentCode'], hwid),
        chassisNumber: getVal(meta, ['vehicleChassisNo'], '---'),
        registrationNo: getVal(meta, ['vehicleRegNo'], '---'),
        status: getVal(v, ['MachineStatus'], 'Off'), 
        location: { 
            lat: parseFloat(getVal(v, ['Latitude'], 0)), 
            lng: parseFloat(getVal(v, ['Longitude'], 0)) 
        },
        metrics: {
          batteryLevel: parseFloat(getVal(v, ['StateofCharge'], 0)),
          speed: parseFloat(getVal(v, ['Speed'], 0)),
          ignition: String(getVal(v, ['KeyOnSignal'])) === '1',
          totalKm: parseFloat(getVal(v, ['Odometer'], 0)),
          dte: parseFloat(getVal(v, ['DistancetoEmpty1'], 0)),
          voltage: parseFloat(getVal(v, ['BatteryVoltage'], 0)),
          temp: parseFloat(getVal(v, ['BatteryTemp', 'BattTemp'], 0)),
          motorTemp: parseFloat(getVal(v, ['MotorTemp', 'MotorTem'], 0)),
          timeToCharge: getVal(v, ['TimetoCharge'], '00:00'),
          vehicleModeRequest: getVal(v, ['VehicleMode'], 'NEUTRAL')
        },
        rawTor: v, 
        equipmentConfig: meta,
        lastUpdate: new Date().toISOString()
      });
    }

    if (batch.length > 0) {
      await axios.post(BULK_URL, batch, { maxContentLength: Infinity, maxBodyLength: Infinity });
      console.log(`[BRIDGE] ✅ Platform Fleet Update Success (${batch.length} nodes).`);
    }
  } catch (err) {
    console.error("[BRIDGE] ❌ Data Error:", err.message);
    if (err.response?.status === 401) authToken = null;
  }
};

fetchAndForward();
setInterval(fetchAndForward, 20000);
