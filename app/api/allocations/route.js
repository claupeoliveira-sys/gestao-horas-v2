import connectDB from '@/lib/mongodb';
import Allocation from '@/lib/models/Allocation';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const personId = searchParams.get('personId');
    const projectId = searchParams.get('projectId');
    const filter = {};
    if (personId) filter.personId = personId;
    if (projectId) filter.projectId = projectId;
    const allocations = await Allocation.find(filter)
      .populate('personId', 'name email role')
      .populate('projectId', 'name client')
      .sort({ createdAt: -1 });
    return NextResponse.json(allocations);
  } catch (err) {
    console.error('GET /api/allocations', err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const allocation = await Allocation.create(body);
  const populated = await Allocation.findById(allocation._id)
    .populate('personId', 'name email role')
    .populate('projectId', 'name client');
  return NextResponse.json(populated || allocation, { status: 201 });
}
