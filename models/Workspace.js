const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    code: { type: String, unique: true, default: () => uuidv4().slice(0, 8).toUpperCase() },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workspace', workspaceSchema);
