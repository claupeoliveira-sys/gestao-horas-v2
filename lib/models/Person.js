import mongoose from 'mongoose';

const PersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  role: String, // função/cargo (ex: Dev, PO)
  team: String,
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  active: { type: Boolean, default: true },
  // Acesso ao sistema
  hasLogin: { type: Boolean, default: false },
  username: { type: String, sparse: true, unique: true },
  passwordHash: { type: String },
  profileRole: { type: String, enum: ['admin', 'user'], default: 'user' },
  mustChangePassword: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

PersonSchema.index({ username: 1 }, { unique: true, sparse: true });

export default mongoose.models.Person || mongoose.model('Person', PersonSchema);
