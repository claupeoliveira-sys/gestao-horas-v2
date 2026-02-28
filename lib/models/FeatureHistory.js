import mongoose from 'mongoose';

const FeatureHistorySchema = new mongoose.Schema({
  featureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Feature', required: true },
  action: { type: String, required: true },
  details: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.FeatureHistory || mongoose.model('FeatureHistory', FeatureHistorySchema);
