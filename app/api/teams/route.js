import connectDB from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectDB();
  const teams = await Team.find().sort({ createdAt: -1 });
  return NextResponse.json(teams);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const team = await Team.create(body);
  return NextResponse.json(team, { status: 201 });
}

