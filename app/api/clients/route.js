import connectDB from '@/lib/mongodb';
import Client from '@/lib/models/Client';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectDB();
  const clients = await Client.find().sort({ name: 1 });
  return NextResponse.json(clients);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const client = await Client.create(body);
  return NextResponse.json(client, { status: 201 });
}
