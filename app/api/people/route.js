import connectDB from '@/lib/mongodb';
import Person from '@/lib/models/Person';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectDB();
  const people = await Person.find()
    .populate('teamId', 'name')
    .sort({ createdAt: -1 });
  return NextResponse.json(people);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const person = await Person.create(body);
  return NextResponse.json(person, { status: 201 });
}

