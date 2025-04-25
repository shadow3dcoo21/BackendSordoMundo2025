const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['estudiante', 'profesor', 'externo', 'admin'],
    default: 'estudiante',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    required: true
  },
  profileRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);