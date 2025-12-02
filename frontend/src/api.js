// frontend/src/api.js
import axios from 'axios';

// Update this if your backend runs on a different host/port
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 6000,
});

/**
 * GET density data.
 * Tries /predict first, then falls back to /counts.
 * Returns the original axios response (so App.jsx can inspect res.data etc).
 */
export async function getDensity() {
  try {
    // primary endpoint
    const res = await API.get('/predict');
    return res;
  } catch (errPredict) {
    // fallback to /counts (some setups use this)
    try {
      const res2 = await API.get('/counts');
      return res2;
    } catch (errCounts) {
      // both failed — throw a meaningful error (caller should catch)
      console.error('getDensity failed for /predict and /counts', { errPredict, errCounts });
      throw new Error('Could not fetch density from backend (/predict or /counts).');
    }
  }
}

/**
 * Optional helper: post an ingest batch for local testing.
 * Example batch:
 * [
 *   {"ts": 1730544000, "ap_iface": "AP-1", "device": "device_001", "rssi": -55}
 * ]
 */
export async function postIngest(batch = []) {
  try {
    const res = await API.post('/ingest', batch);
    return res;
  } catch (err) {
    console.error('postIngest error', err);
    throw err;
  }
}

export default {
  getDensity,
  postIngest,
};
