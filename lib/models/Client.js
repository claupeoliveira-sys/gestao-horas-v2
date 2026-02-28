import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: String,
  email: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
