require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// License Schema
const licenseSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  tier: { type: String, enum: ['1m', '3m', '6m'], required: true },
  status: { type: String, default: 'active', enum: ['active', 'expired', 'revoked'] },
  customerEmail: String,
  activatedAt: Date,
  expiresAt: Date,
  deviceId: String,
  createdAt: { type: Date, default: Date.now }
});

const License = mongoose.model('License', licenseSchema);

// Generate License Key
function generateKey(tier) {
  const prefix = tier === '1m' ? 'VTO1' : tier === '3m' ? 'VTO3' : 'VTO6';
  const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
  return `${prefix}-${randomPart.slice(0,4)}-${randomPart.slice(4,8)}-${randomPart.slice(8)}`;
}

// === SHOPIFY WEBHOOK ===
app.post('/webhook', async (req, res) => {
  try {
    const order = req.body;

    for (const item of order.line_items || []) {
      let tier = null;
      const itemName = item
