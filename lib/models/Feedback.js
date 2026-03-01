import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['positive', 'performance', 'improvement', 'situation', 'other'], default: 'other' },
  title: String,
  description: { type: String, required: true },
  impactLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  followUpStatus: { type: String, enum: ['pending', 'in_progress', 'done'], default: 'pending' },
  rating: { type: Number, min: 1, max: 5 },
  followUpDate: Date,
  tags: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
