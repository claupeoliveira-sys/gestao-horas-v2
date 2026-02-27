import mongoose from 'mongoose';

const ProjectLogSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  date: { type: Date, required: true },
  source: {
    type: String,
    enum: ['email', 'meeting', 'status_report'],
    required: true,
  },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ProjectLog || mongoose.model('ProjectLog', ProjectLogSchema);
