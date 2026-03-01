import connectDB from '@/lib/mongodb';
import Person from '@/lib/models/Person';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

const excludePassword = '-passwordHash';

export async function GET() {
  try {
    await connectDB();
    const people = await Person.find()
      .select(excludePassword)
      .populate('teamId', 'name')
      .sort({ createdAt: -1 });
    return NextResponse.json(people);
  } catch (err) {
    console.error('GET /api/people', err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const { passwordPlain, ...rest } = body;
  const data = { ...rest };
  if (data.hasLogin && data.username && passwordPlain) {
    data.passwordHash = await hash(passwordPlain, 10);
    data.mustChangePassword = true;
  }
  if (data.username) data.username = data.username.trim().toLowerCase();
  const person = await Person.create(data);
  const out = person.toObject ? person.toObject() : person;
  if (out) delete out.passwordHash;
  return NextResponse.json(out, { status: 201 });
}

