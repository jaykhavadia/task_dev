const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  collaborators: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      permission: { type: String, enum: ["read", "write"] },
    },
  ],
  lastUpdated: { type: Date, default: Date.now },
  isArchived: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Note", noteSchema);
