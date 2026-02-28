import connectDB from '@/lib/mongodb';
import Feature from '@/lib/models/Feature';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const feature = await Feature.findByIdAndUpdate(params.id, body, { new: true })
    .populate('analystIds', 'name email');
  return NextResponse.json(feature);
}
