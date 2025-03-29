const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  starsRatings: { type: [Number], default: [] },
  usersRated: { type: [String], default: [] },
  image: String,
  temperature: { type: [Number], default: [] },
  humidity: { type: [Number], default: [] },
  sound: { type: [Number], default: [] },
  dust: { type: [Number], default: [] },
  gas: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Location", locationSchema);
