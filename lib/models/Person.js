import mongoose from 'mongoose';

const PersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  role: String,
  team: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Person || mongoose.model('Person', PersonSchema);
