import mongoose from 'mongoose';

const EpicSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: String,
  estimatedHours: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Epic || mongoose.model('Epic', EpicSchema);
