import mongoose from 'mongoose';

const ProjectLogSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  date: { type: Date, required: true },
  source: {
    type: String,
    enum: ['email', 'meeting', 'status_report', 'other'],
    required: true,
  },
  content: { type: String, required: true },
  nextSteps: String,
  decisions: String,
  createdAt: { type: Date, default: Date.now },
});

ProjectLogSchema.index({ projectId: 1 });

export default mongoose.models.ProjectLog || mongoose.model('ProjectLog', ProjectLogSchema);
