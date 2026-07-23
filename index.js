require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

const licenseSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  tier: { type: String, enum: ['1m', '3m', '6m'], required: true },
  status: { type: String, default: 'active' },
  customerEmail: String,
  activatedAt: Date,
  expiresAt: Date,
  deviceId: String,
  createdAt: { type: Date, default: Date.now }
});

const License = mongoose.model('License', licenseSchema);

function generateKey(tier) {
  const prefix = tier === '1m' ? 'VTO1' : tier === '3m' ? 'VTO3' : 'VTO6';
  const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
  return `${prefix}-${randomPart.slice(0,4)}-${randomPart.slice(4,8)}-${randomPart.slice(8)}`;
}

app.post('/webhook', async (req, res) => {
  try {
    const order = req.body;
    for (const item of order.line_items || []) {
      let tier = null;
      const name = item.name.toLowerCase();
      if (name.includes("1 month")) tier = '1m';
      else if (name.includes("3 month")) tier = '3m';
      else if (name.includes("6 month")) tier = '6m';

      if (tier) {
        const months = tier === '1m' ? 1 : tier === '3m' ? 3 : 6;
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + months);

        const license = new License({
          key: generateKey(tier),
          tier,
          customerEmail: order.customer?.email || order.email,
          expiresAt
        });
        await license.save();
        console.log(`✅ Generated key: ${license.key}`);
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(200);
  }
});

app.post('/validate', async (req, res) => {
  try {
    const { licenseKey, deviceId } = req.body;
    if (!licenseKey) return res.json({ valid: false, error: "No key" });

    const license = await License.findOne({ key: licenseKey.toUpperCase().trim() });

    if (!license || license.status !== 'active') {
      return res.json({ valid: false, error: "Invalid key" });
    }

    if (new Date() > license.expiresAt) {
      license.status = 'expired';
      await license.save();
      return res.json({ valid: false, error: "Expired" });
    }

    if (!license.deviceId) {
      license.deviceId = deviceId;
      license.activatedAt = new Date();
      await license
      let tier = null;
      const itemName = item
