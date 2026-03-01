import connectDB from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Feature from '@/lib/models/Feature';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const projects = await Project.find({ status: 'active' }).lean();
  const projectIds = projects.map((p) => p._id);
  const features = await Feature.find({ projectId: { $in: projectIds } }).lean();

  const byProject = {};
  features.forEach((f) => {
    const pid = f.projectId?.toString?.() || f.projectId;
    if (!byProject[pid]) byProject[pid] = { estimated: 0, logged: 0, blocked: 0 };
    byProject[pid].estimated += Number(f.estimatedHours) || 0;
    byProject[pid].logged += Number(f.loggedHours) || 0;
    if (f.status === 'block_internal' || f.status === 'block_client') byProject[pid].blocked += 1;
  });

  let overdueCount = 0;
  let overHoursCount = 0;
  let blockedCount = 0;
  projects.forEach((p) => {
    if (p.endDate) {
      const end = new Date(p.endDate);
      end.setHours(0, 0, 0, 0);
      if (end < today) overdueCount += 1;
    }
    const m = byProject[p._id.toString()] || { estimated: 0, logged: 0, blocked: 0 };
    if (m.estimated > 0 && m.logged > m.estimated) overHoursCount += 1;
    if (m.blocked > 0) blockedCount += 1;
  });

  const total = overdueCount + overHoursCount + blockedCount;
  return NextResponse.json({
    overdueCount,
    overHoursCount,
    blockedCount,
    total: total > 0 ? total : 0,
  });
}
