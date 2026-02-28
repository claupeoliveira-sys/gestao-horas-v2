import mongoose from 'mongoose';

const PersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  role: String,
  team: String,
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Person || mongoose.model('Person', PersonSchema);
