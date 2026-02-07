const mongoose = require('mongoose');

const DocSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  filename: { type: String, required: true },
  size: { type: Number, required: true },
  textContent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', DocSchema);