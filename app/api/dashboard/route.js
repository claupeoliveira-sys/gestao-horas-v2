import connectDB from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Feature from '@/lib/models/Feature';
import Constatacao from '@/lib/models/Constatacao';
import ProjectLog from '@/lib/models/ProjectLog';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const [projects, features, constatacoes, projectLogs] = await Promise.all([
      Project.find({}).lean(),
      Feature.find({}).lean(),
      Constatacao.find({}).lean(),
      ProjectLog.find({}).lean(),
    ]);
    return NextResponse.json({
      projects,
      features,
      constatacoes,
      projectLogs,
    });
  } catch (err) {
    console.error('GET /api/dashboard', err);
    return NextResponse.json({
      projects: [],
      features: [],
      constatacoes: [],
      projectLogs: [],
    }, { status: 200 });
  }
}
