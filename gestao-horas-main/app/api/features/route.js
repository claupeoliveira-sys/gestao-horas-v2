import connectDB from '@/lib/mongodb';
import Feature from '@/lib/models/Feature';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const epicId = searchParams.get('epicId');
  const projectId = searchParams.get('projectId');
  const filter = {};
  if (epicId) filter.epicId = epicId;
  if (projectId) filter.projectId = projectId;
  const features = await Feature.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(features);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const feature = await Feature.create(body);
  return NextResponse.json(feature, { status: 201 });
}
