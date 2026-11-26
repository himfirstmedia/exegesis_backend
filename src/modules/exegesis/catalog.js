import { prisma } from '../../config/db.js';

export const catalogPassages = study => Array.isArray(study?.sessions) ? study.sessions : [];

export async function listLabStudies(userId) {
  const studies = await prisma.labStudy.findMany({ where: { active: true }, orderBy: { id: 'asc' } });
  const [progress, plans] = await Promise.all([prisma.exegesisSession.findMany({
    where: { userId, labStudyId: { in: studies.map(s => s.id) }, currentStage: 'completed' },
    distinct: ['labStudyId', 'labStudyPosition'],
    select: { labStudyId: true, labStudyPosition: true },
  }), prisma.readingPlan.findMany({
    where: { planId: { in: studies.filter(study => study.pathway === 'reading-plan').map(study => study.id) }, isActive: true },
    select: { planId: true, title: true, description: true, dailyAssignments: {
      orderBy: { dayNumber: 'asc' }, select: { dayNumber: true, chaptersJson: true },
    } },
  })]);
  return studies.flatMap(({ active: _active, ...study }) => {
    const plan = plans.find(item => item.planId === study.id);
    if (study.pathway === 'reading-plan' && !plan) return [];
    const sessions = catalogPassages(study).map((session, index) => {
      if (!plan) return session;
      const assignment = plan.dailyAssignments.find(day => day.dayNumber === index + 1);
      try {
        const chapters = JSON.parse(assignment?.chaptersJson ?? '[]');
        if (!Array.isArray(chapters) || !chapters.some(row => row.book === session.bookName && Number(row.chapter) === session.chapter)) return null;
        return { ...session, assignedReading: chapters.map(row => `${row.book} ${row.chapter}`).join(', ') };
      } catch { return null; }
    });
    if (sessions.some(session => !session)) return [];
    if (!sessions.length) return [];
    const completedPositions = progress.filter(row => row.labStudyId === study.id).map(row => row.labStudyPosition);
    return [{ ...study, ...(plan ? { title: plan.title, purpose: plan.description || study.purpose } : {}),
      sessions, firstPassage: sessions[0], completedPositions }];
  });
}
