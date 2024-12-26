const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema({
  participants: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    required: true,
    validate: [arrayLimit, "Participants must include exactly two users"],
  },
  messages: [messageSchema],
  lastMessage: {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware to auto-update `updatedAt` before saving
chatSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

function arrayLimit(val) {
  return val.length === 2; // Ensures exactly two participants
}

module.exports = mongoose.model("Chat", chatSchema);
