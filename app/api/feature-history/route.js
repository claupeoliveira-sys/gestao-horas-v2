import connectDB from '@/lib/mongodb';
import FeatureHistory from '@/lib/models/FeatureHistory';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const featureId = searchParams.get('featureId');
  const filter = featureId ? { featureId } : {};
  const history = await FeatureHistory.find(filter).sort({ createdAt: -1 }).limit(100);
  return NextResponse.json(history);
}
