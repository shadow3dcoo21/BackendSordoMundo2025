const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  coverImage: { type: String }, // Cover image URL
  iframe: { type: String },     // Embed code
  difficulty: { type: String }, // Easy, Medium, Hard, etc.
  uploadedBy: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: String,
      username: String,
      fullName: String
    }
  ]
}, {
  timestamps: true
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;