import connectDB from '@/lib/mongodb';
import Feedback from '@/lib/models/Feedback';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const personId = searchParams.get('personId');
  const projectId = searchParams.get('projectId');
  const filter = {};
  if (personId) filter.personId = personId;
  if (projectId) filter.projectId = projectId;
  const feedbacks = await Feedback.find(filter).sort({ date: -1 });
  return NextResponse.json(feedbacks);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const feedback = await Feedback.create(body);
  return NextResponse.json(feedback, { status: 201 });
}
