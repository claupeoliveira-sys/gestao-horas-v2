import mongoose from 'mongoose';

const FeatureSchema = new mongoose.Schema({
  code: { type: String }, // ID legível ex: FEAT-001
  epicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Epic', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: String,
  estimatedHours: { type: Number, required: true },
  loggedHours: { type: Number, default: 0 },
  percentComplete: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, enum: ['backlog', 'in_progress', 'block_internal', 'block_client', 'done'], default: 'backlog' },
  details: String,
  userStory: String,
  analystIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  attachments: [{ name: String, url: String }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Feature || mongoose.model('Feature', FeatureSchema);
