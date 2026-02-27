import mongoose from 'mongoose';

const ConstatacaoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  epicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Epic' },
  featureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Feature' },
  type: { type: String, enum: ['risk', 'opportunity', 'observation', 'other'], default: 'observation' },
  date: { type: Date, default: Date.now },
  /* Preparado para IA: campos extras para análise futura */
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Constatacao || mongoose.model('Constatacao', ConstatacaoSchema);
