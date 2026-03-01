import connectDB from '@/lib/mongodb';
import Feature from '@/lib/models/Feature';
import FeatureHistory from '@/lib/models/FeatureHistory';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const previous = await Feature.findById(params.id).lean();
  if (!previous) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const update = { ...body };
  if (body.status !== undefined && body.order === undefined) {
    const targetStatus = body.status;
    const projectId = previous.projectId?.toString?.() || previous.projectId;
    const maxOrder = await Feature.findOne({ projectId, status: targetStatus }).sort({ order: -1 }).select('order').lean();
    update.order = (maxOrder?.order ?? -1) + 1;
  }
  const feature = await Feature.findByIdAndUpdate(params.id, update, { new: true })
    .populate('analystIds', 'name email');

  if ((body.order !== undefined || body.status !== undefined) && feature) {
    const projectId = feature.projectId?.toString?.() || feature.projectId;
    const status = feature.status || 'backlog';
    const sameColumn = await Feature.find({ projectId, status }).sort({ order: 1, createdAt: 1 }).select('_id order').lean();
    sameColumn.forEach((f, idx) => {
      if (f.order !== idx) Feature.findByIdAndUpdate(f._id, { order: idx }).exec();
    });
  }

  const historyEntries = [];
  if (body.status !== undefined && String(previous.status) !== String(body.status)) {
    historyEntries.push({ featureId: params.id, action: 'status_change', details: `Status: ${previous.status} → ${body.status}`, oldValue: previous.status, newValue: body.status });
  }
  if (body.percentComplete !== undefined && Number(previous.percentComplete) !== Number(body.percentComplete)) {
    historyEntries.push({ featureId: params.id, action: 'progress_change', details: `Conclusão: ${previous.percentComplete}% → ${body.percentComplete}%`, oldValue: previous.percentComplete, newValue: body.percentComplete });
  }
  if (body.loggedHours !== undefined && Number(previous.loggedHours) !== Number(body.loggedHours)) {
    historyEntries.push({ featureId: params.id, action: 'hours_change', details: `Horas lançadas: ${previous.loggedHours} → ${body.loggedHours}`, oldValue: previous.loggedHours, newValue: body.loggedHours });
  }
  if (body.analystIds !== undefined) {
    const oldIds = (previous.analystIds || []).map((a) => String(a)).sort().join(',');
    const newIds = (body.analystIds || []).map((a) => String(a)).sort().join(',');
    if (oldIds !== newIds) {
      historyEntries.push({ featureId: params.id, action: 'analysts_change', details: 'Alteração de pessoas', oldValue: previous.analystIds, newValue: body.analystIds });
    }
  }
  if (historyEntries.length) await FeatureHistory.insertMany(historyEntries);

  return NextResponse.json(feature);
}

export async function DELETE(req, { params }) {
  await connectDB();
  const feature = await Feature.findByIdAndDelete(params.id);
  if (!feature) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
