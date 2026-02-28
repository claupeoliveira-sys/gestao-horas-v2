import mongoose from 'mongoose';

const FeatureSchema = new mongoose.Schema({
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
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Feature || mongoose.model('Feature', FeatureSchema);
