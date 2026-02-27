import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['positive', 'improvement', 'situation', 'other'], default: 'other' },
  title: String,
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
