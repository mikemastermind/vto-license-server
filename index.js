require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error', err));

const License = mongoose.model('License', new mongoose.Schema({
  key: String,
  tier: String,
  status: { type: String, default: 'active' },
  customerEmail: String,
  expiresAt: Date,
  deviceId: String,
  activatedAt: Date
}));

function generateKey(tier) {
  const prefix = tier === '1m' ? 'VTO1' : tier === '3m' ? 'VTO3' : 'VTO6';
  const rand = Math.random().toString(36).substring(2, 15).toUpperCase();
  return `${prefix}-${rand.slice(0,4)}-${rand.slice(4,8)}-${rand.slice(8)}`;
}

app.get('/', (req, res) => res.send('VTO License Server is running ✅'));

app.post('/validate', async (req, res) => {
  try {
    const { licenseKey, deviceId } = req.body || {};
    if (!licenseKey) return res.json({ valid: false, error: "No key" });

    const license = await License.findOne({ key: licenseKey.toUpperCase().trim() });
    if (!license || license.status !== 'active') return res.json({ valid: false, error: "Invalid key" });

    if (new Date() > license.expiresAt) {
      license.status = 'expired';
      await license.save();
      return res.json({ valid: false, error: "Expired" });
    }

    if (!license.deviceId) {
      license.deviceId = deviceId || 'unknown';
      license.activatedAt = new Date();
      await license.save();
    } else if (license.deviceId !== deviceId) {
      return res.json({ valid: false, error: "Used on another device" });
    }

    res.json({ valid: true, expiresAt: license.expiresAt });
  } catch (err) {
    console.error(err);
    res.json({ valid: false, error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
