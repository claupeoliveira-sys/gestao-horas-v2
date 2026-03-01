import connectDB from '@/lib/mongodb';
import FeatureHistory from '@/lib/models/FeatureHistory';
import Feature from '@/lib/models/Feature';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const featureId = searchParams.get('featureId');
  const projectId = searchParams.get('projectId');
  let filter = {};
  if (featureId) {
    filter.featureId = featureId;
  } else if (projectId) {
    const featureIds = await Feature.find({ projectId }).distinct('_id');
    filter.featureId = { $in: featureIds };
  }
  const history = await FeatureHistory.find(filter).sort({ createdAt: -1 }).limit(200);
  return NextResponse.json(history);
}
