import mongoose from 'mongoose';

const AllocationSchema = new mongoose.Schema({
  personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  percentual: { type: Number, required: true, min: 0, max: 100 },
  horasPrevistas: { type: Number, required: true, min: 0 },
  observacao: String,
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now },
});

AllocationSchema.index({ personId: 1, projectId: 1 });

export default mongoose.models.Allocation || mongoose.model('Allocation', AllocationSchema);
