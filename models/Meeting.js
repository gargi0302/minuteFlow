const mongoose = require('mongoose');

const agendaItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
});

const decisionSchema = new mongoose.Schema({
  agendaRef: { type: String },
  decision: { type: String, required: true },
  decidedBy: { type: String },
});

const meetingSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    venue: { type: String },
    attendees: [{ type: String }],
    agenda: [agendaItemSchema],
    decisions: [decisionSchema],
    transcript: { type: String },
    mom: {
      content: { type: String },
      generatedAt: { type: Date },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'finalized'], default: 'draft' },

    // Access control
    visibility: {
      type: String,
      enum: ['everyone', 'restricted'],
      default: 'everyone',
    },
    allowedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meeting', meetingSchema);
