import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: String, required: true },
  description: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['active', 'paused', 'finished'], default: 'active' },
  totalHours: { type: Number, default: 0 },
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
