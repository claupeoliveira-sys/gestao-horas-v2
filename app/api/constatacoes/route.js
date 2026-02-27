import connectDB from '@/lib/mongodb';
import Constatacao from '@/lib/models/Constatacao';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const epicId = searchParams.get('epicId');
  const featureId = searchParams.get('featureId');
  const filter = {};
  if (projectId) filter.projectId = projectId;
  if (epicId) filter.epicId = epicId;
  if (featureId) filter.featureId = featureId;
  const constatacoes = await Constatacao.find(filter).sort({ date: -1 });
  return NextResponse.json(constatacoes);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const constatacao = await Constatacao.create(body);
  return NextResponse.json(constatacao, { status: 201 });
}
