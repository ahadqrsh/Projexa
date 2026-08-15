/**
 * Seed script.
 *
 * The point of this file is that `npm run seed && npm run dev` gives a working,
 * demonstrable application on a fresh clone — including a project with every
 * implemented module already generated, so the whole UI can be shown without
 * spending a single AI credit or holding a Gemini key.
 *
 *   npm run seed           populate
 *   npm run seed:destroy   wipe
 */

import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import logger from '../config/logger.js';
import env from '../config/env.js';
import {
  User,
  Project,
  Artifact,
  Sprint,
  Task,
  Notification,
  Comment,
} from '../models/index.js';
import { ROLES } from '../../../shared/constants/roles.js';
import { ARTIFACT_TYPES } from '../../../shared/constants/artifactTypes.js';
import { PROJECT_STATUS, PROJECT_VISIBILITY, TASK_STATUS } from '../../../shared/constants/statuses.js';
import { getMockFixture } from '../services/ai/providers/mockFixtures.js';
import { getImplementedTypes } from '../services/ai/GeneratorRegistry.js';

const PASSWORD = 'Password@123';

const destroy = async () => {
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}).setOptions({ includeDeleted: true }),
    Artifact.deleteMany({}),
    Sprint.deleteMany({}),
    Task.deleteMany({}),
    Notification.deleteMany({}),
    Comment.deleteMany({}),
  ]);
  logger.info('Database cleared');
};

const seed = async () => {
  await destroy();

  /* ── Users ───────────────────────────────────────────────────────────── */
  // create() (not insertMany) so the password-hashing pre-save hook runs.
  const admin = await User.create({
    name: 'Platform Admin',
    email: 'admin@apm.dev',
    password: PASSWORD,
    role: ROLES.ADMIN,
    isEmailVerified: true,
    college: 'XYZ Institute of Technology',
  });

  const mentor = await User.create({
    name: 'Prof. A. Sharma',
    email: 'mentor@apm.dev',
    password: PASSWORD,
    role: ROLES.MENTOR,
    isEmailVerified: true,
    college: 'XYZ Institute of Technology',
    branch: 'Computer Science',
    bio: 'Faculty supervisor for final-year projects.',
  });

  const student = await User.create({
    name: 'Ahad Qureshi',
    email: 'student@apm.dev',
    password: PASSWORD,
    role: ROLES.STUDENT,
    isEmailVerified: true,
    college: 'XYZ Institute of Technology',
    branch: 'Computer Science',
    graduationYear: 2027,
    skills: ['React', 'Node.js', 'MongoDB', 'Express'],
  });

  const peers = await User.create([
    { name: 'Sara Mehta', email: 'sara@apm.dev', password: PASSWORD, isEmailVerified: true },
    { name: 'Rohit Nair', email: 'rohit@apm.dev', password: PASSWORD, isEmailVerified: true },
  ]);

  logger.info(`Seeded ${3 + peers.length} users`);

  /* ── Projects ────────────────────────────────────────────────────────── */
  const demoProject = await Project.create({
    owner: student._id,
    mentors: [mentor._id],
    title: 'AI-Powered Hospital Management System',
    description:
      'A MERN platform where patients book appointments, doctors manage prescriptions and medical history, and administrators view analytics. AI suggests optimal appointment slots and flags high-risk patients for follow-up.',
    domain: 'healthcare',
    difficulty: 'advanced',
    teamSize: 3,
    preferredTech: ['React', 'Node.js', 'MongoDB', 'Express'],
    deadline: new Date(Date.now() + 120 * 86_400_000),
    aiIntegrationRequired: true,
    projectType: 'web',
    tags: ['mern', 'healthcare', 'ai'],
    status: PROJECT_STATUS.IN_PROGRESS,
    visibility: PROJECT_VISIBILITY.PUBLIC,
  });

  const otherProjects = await Project.create([
    {
      owner: student._id,
      title: 'Adaptive E-Learning Portal',
      description:
        'A learning platform that adapts quiz difficulty to each student in real time, tracks mastery per topic, and gives instructors a cohort-level view of where the class is struggling.',
      domain: 'education',
      difficulty: 'intermediate',
      teamSize: 2,
      preferredTech: ['React', 'Node.js'],
      deadline: new Date(Date.now() + 90 * 86_400_000),
      aiIntegrationRequired: true,
      status: PROJECT_STATUS.DRAFT,
    },
    {
      owner: student._id,
      title: 'Smart Agriculture Monitoring Dashboard',
      description:
        'An IoT dashboard aggregating soil moisture, temperature and humidity sensors across a farm, with threshold alerts and irrigation scheduling recommendations for the farmer.',
      domain: 'agriculture',
      difficulty: 'intermediate',
      teamSize: 4,
      deadline: new Date(Date.now() + 150 * 86_400_000),
      status: PROJECT_STATUS.READY,
      visibility: PROJECT_VISIBILITY.PUBLIC,
    },
    {
      owner: peers[0]._id,
      mentors: [mentor._id],
      title: 'Personal Finance Tracker with Insights',
      description:
        'A budgeting application that categorises transactions automatically, forecasts month-end balance, and surfaces spending anomalies compared with the user historical average.',
      domain: 'finance',
      difficulty: 'beginner',
      teamSize: 1,
      deadline: new Date(Date.now() + 60 * 86_400_000),
      status: PROJECT_STATUS.IN_PROGRESS,
      visibility: PROJECT_VISIBILITY.PUBLIC,
    },
  ]);

  logger.info(`Seeded ${1 + otherProjects.length} projects`);

  /* ── Artifacts for the demo project ──────────────────────────────────── */
  const implemented = getImplementedTypes();
  const artifacts = implemented.map((type) => ({
    project: demoProject._id,
    type,
    content: getMockFixture(type, demoProject),
    status: 'completed',
    version: 1,
    provider: 'seed',
    model: 'seed-fixture',
    promptVersion: `${type.toLowerCase()}@1.0`,
    generatedAt: new Date(),
    generationMeta: { promptTokens: 1100, completionTokens: 850, latencyMs: 8400, attempts: 1 },
  }));

  await Artifact.insertMany(artifacts);
  demoProject.generatedModules = implemented;
  demoProject.lastGeneratedAt = new Date();

  // One deliberately stale artifact so the "your idea changed" banner is demonstrable.
  await Artifact.updateOne(
    { project: demoProject._id, type: ARTIFACT_TYPES.API_DESIGN },
    { isStale: true }
  );

  logger.info(`Seeded ${artifacts.length} artifacts`);

  /* ── Sprints and tasks ───────────────────────────────────────────────── */
  const sprintPlan = [
    { week: 1, title: 'Project setup & authentication', category: 'setup' },
    { week: 2, title: 'Database models & core API', category: 'backend' },
    { week: 3, title: 'Dashboard & CRUD screens', category: 'frontend' },
    { week: 4, title: 'AI integration', category: 'ai' },
    { week: 5, title: 'Testing & hardening', category: 'testing' },
    { week: 6, title: 'Deployment & documentation', category: 'deployment' },
  ];

  let doneCount = 0;
  let totalCount = 0;

  for (const [index, plan] of sprintPlan.entries()) {
    const start = new Date(Date.now() + (index - 2) * 7 * 86_400_000);
    const sprint = await Sprint.create({
      project: demoProject._id,
      weekNumber: plan.week,
      title: plan.title,
      goal: `Complete all ${plan.category} work planned for week ${plan.week}.`,
      startDate: start,
      endDate: new Date(start.getTime() + 6 * 86_400_000),
      status: index < 2 ? 'completed' : index === 2 ? 'in_progress' : 'not_started',
      order: index,
    });

    const taskTitles = [
      `Design ${plan.title.toLowerCase()}`,
      `Implement ${plan.title.toLowerCase()}`,
      `Review and test ${plan.title.toLowerCase()}`,
    ];

    for (const [taskIndex, title] of taskTitles.entries()) {
      const isDone = index < 2 || (index === 2 && taskIndex === 0);
      totalCount += 1;
      if (isDone) doneCount += 1;

      await Task.create({
        project: demoProject._id,
        sprint: sprint._id,
        title,
        description: `Auto-generated task for sprint ${plan.week}.`,
        category: plan.category,
        status: isDone ? TASK_STATUS.DONE : taskIndex === 1 && index === 2 ? TASK_STATUS.IN_PROGRESS : TASK_STATUS.TODO,
        priority: taskIndex === 1 ? 'high' : 'medium',
        estimatedHours: 6,
        order: taskIndex,
        dueDate: new Date(start.getTime() + (taskIndex + 1) * 2 * 86_400_000),
      });
    }
  }

  demoProject.completionPercentage = Math.round((doneCount / totalCount) * 100);
  await demoProject.save();

  logger.info(`Seeded ${sprintPlan.length} sprints and ${totalCount} tasks`);

  /* ── Comments and notifications ──────────────────────────────────────── */
  await Comment.create([
    {
      project: demoProject._id,
      author: mentor._id,
      artifactType: ARTIFACT_TYPES.DATABASE_DESIGN,
      body: 'Good structure overall. Consider adding an index on appointments.scheduledFor — you will query by date range constantly.',
    },
    {
      project: demoProject._id,
      author: mentor._id,
      artifactType: ARTIFACT_TYPES.SRS,
      body: 'FR-02 needs a measurable acceptance criterion before this goes in the report.',
    },
  ]);

  await Notification.create([
    {
      user: student._id,
      type: 'mentor_comment',
      title: 'New comment from your mentor',
      message: 'Prof. A. Sharma commented on Database Design.',
      link: `/projects/${demoProject._id}/module/database-design`,
      metadata: { projectId: demoProject._id },
    },
    {
      user: student._id,
      type: 'generation_completed',
      title: 'Generation complete',
      message: `All ${implemented.length} module(s) generated for "${demoProject.title}".`,
      link: `/projects/${demoProject._id}`,
      isRead: true,
    },
  ]);

  logger.info('Seeded comments and notifications');

  /* eslint-disable no-console */
  console.log(`
┌──────────────────────────────────────────────────────────────┐
│  Seed complete                                               │
├──────────────────────────────────────────────────────────────┤
│  Admin    admin@apm.dev     ${PASSWORD}                  │
│  Mentor   mentor@apm.dev    ${PASSWORD}                  │
│  Student  student@apm.dev   ${PASSWORD}                  │
├──────────────────────────────────────────────────────────────┤
│  Demo project: ${demoProject.title.slice(0, 42).padEnd(42)}  │
│  Modules generated: ${String(implemented.length).padEnd(38)}  │
│  AI provider: ${env.AI_PROVIDER.padEnd(44)}  │
└──────────────────────────────────────────────────────────────┘
`);
  /* eslint-enable no-console */
};

const run = async () => {
  try {
    await connectDatabase();
    if (process.argv.includes('--destroy')) {
      await destroy();
    } else {
      await seed();
    }
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    logger.error(error.stack);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

run();
