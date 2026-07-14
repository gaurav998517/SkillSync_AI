#!/usr/bin/env node
/**
 * Firestore → PostgreSQL Migration Script
 * ========================================
 * Reads all Firestore collections and inserts into PostgreSQL via Prisma.
 *
 * Features:
 *  - Idempotent (safe to re-run — uses upsert everywhere)
 *  - ID mapping table preserves Firestore → UUID relationships
 *  - Checkpoint file allows resuming after failures
 *  - Dry-run mode: `node migrateFirestoreToPostgres.js --dry-run`
 *
 * Usage:
 *   node backend/scripts/migrateFirestoreToPostgres.js
 *   node backend/scripts/migrateFirestoreToPostgres.js --dry-run
 *
 * Prerequisites:
 *   1. Set DATABASE_URL in backend/.env
 *   2. Set FIREBASE_SERVICE_ACCOUNT_PATH in backend/.env
 *   3. Run `npx prisma migrate deploy` first
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// ── Configuration ─────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');
const CHECKPOINT_FILE = path.join(__dirname, 'migration_checkpoint.json');

const prisma = new PrismaClient({ log: ['error'] });

// ── Firebase Initialization ───────────────────────────────────────────────────

let db;
try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const absolutePath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.join(__dirname, '..', serviceAccountPath);

    const serviceAccount = require(absolutePath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
    console.log('✅ Firestore connected');
} catch (err) {
    console.error('❌ Failed to initialize Firestore:', err.message);
    process.exit(1);
}

// ── Checkpoint Helpers ────────────────────────────────────────────────────────

let checkpoint = { completedCollections: [], idMap: {} };

const loadCheckpoint = () => {
    if (fs.existsSync(CHECKPOINT_FILE)) {
        checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
        console.log(`📌 Resuming from checkpoint. Completed: [${checkpoint.completedCollections.join(', ')}]`);
    }
};

const saveCheckpoint = () => {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
};

const markComplete = (collection) => {
    if (!checkpoint.completedCollections.includes(collection)) {
        checkpoint.completedCollections.push(collection);
        saveCheckpoint();
    }
};

/**
 * Map a Firestore document ID to a stable UUID.
 * Creates and caches the mapping so FK relationships are preserved.
 * @param {string} firestoreId
 * @returns {string} UUID
 */
const getUUID = (firestoreId) => {
    if (!checkpoint.idMap[firestoreId]) {
        checkpoint.idMap[firestoreId] = uuidv4();
        saveCheckpoint();
    }
    return checkpoint.idMap[firestoreId];
};

// ── Collection Fetcher ────────────────────────────────────────────────────────

const fetchCollection = async (collectionName) => {
    const snapshot = await db.collection(collectionName).get();
    console.log(`  📦 Fetched ${snapshot.size} docs from Firestore [${collectionName}]`);
    return snapshot.docs.map((doc) => ({ firestoreId: doc.id, ...doc.data() }));
};

// ── Migration Functions ───────────────────────────────────────────────────────

const migrateUsers = async () => {
    if (checkpoint.completedCollections.includes('users')) {
        console.log('  ⏭  users — skipped (already complete)');
        return;
    }
    console.log('\n🔄 Migrating users...');
    const docs = await fetchCollection('users');
    let count = 0;

    for (const doc of docs) {
        const uuid = getUUID(doc.firestoreId);
        const userData = {
            id: uuid,
            name: doc.name || 'Unknown',
            email: (doc.email || '').toLowerCase(),
            passwordHash: doc.password || '',
            role: doc.role || 'applicant',
            isActive: true,
            isDeleted: false,
            createdAt: doc.createdAt?.toDate?.() || new Date(),
            updatedAt: doc.updatedAt?.toDate?.() || new Date(),
        };

        if (!DRY_RUN) {
            await prisma.user.upsert({
                where: { id: uuid },
                create: userData,
                update: { name: userData.name, updatedAt: userData.updatedAt },
            });
        }
        count++;
    }

    console.log(`  ✅ Users migrated: ${count}${DRY_RUN ? ' (DRY RUN)' : ''}`);
    markComplete('users');
};

const migrateResumes = async () => {
    if (checkpoint.completedCollections.includes('resumes')) {
        console.log('  ⏭  resumes — skipped (already complete)');
        return;
    }
    console.log('\n🔄 Migrating resumes...');
    const docs = await fetchCollection('resumes');
    let count = 0;
    let skipped = 0;

    for (const doc of docs) {
        const uuid = getUUID(doc.firestoreId);
        const userUUID = doc.userId ? getUUID(doc.userId) : null;

        if (!userUUID) {
            console.warn(`  ⚠️  Resume ${doc.firestoreId} has no userId — skipping`);
            skipped++;
            continue;
        }

        const resumeData = {
            id: uuid,
            userId: userUUID,
            filename: doc.filename || 'unknown.pdf',
            filepath: doc.filepath || '',
            rawText: doc.rawText || '',
            skills: Array.isArray(doc.skills) ? doc.skills.map((s) => s.toLowerCase().trim()) : [],
            education: Array.isArray(doc.education) ? doc.education : [],
            uploadedAt: doc.uploadedAt?.toDate?.() || new Date(),
            createdAt: doc.createdAt?.toDate?.() || new Date(),
            updatedAt: doc.updatedAt?.toDate?.() || new Date(),
        };

        if (!DRY_RUN) {
            await prisma.resume.upsert({
                where: { id: uuid },
                create: resumeData,
                update: { skills: resumeData.skills, updatedAt: resumeData.updatedAt },
            });
        }
        count++;
    }

    console.log(`  ✅ Resumes migrated: ${count}, skipped: ${skipped}${DRY_RUN ? ' (DRY RUN)' : ''}`);
    markComplete('resumes');
};

const migrateJobs = async () => {
    if (checkpoint.completedCollections.includes('jobs')) {
        console.log('  ⏭  jobs — skipped (already complete)');
        return;
    }
    console.log('\n🔄 Migrating jobs...');
    const docs = await fetchCollection('jobs');
    let count = 0;

    for (const doc of docs) {
        const uuid = getUUID(doc.firestoreId);
        const jobData = {
            id: uuid,
            title: doc.title || 'Untitled',
            company: doc.company || 'Unknown',
            requiredSkills: Array.isArray(doc.requiredSkills)
                ? [...new Set(doc.requiredSkills.map((s) => s.toLowerCase().trim()).filter(Boolean))]
                : [],
            minExperience: doc.minExperience || 0,
            description: doc.description || '',
            isActive: true,
            createdAt: doc.createdAt?.toDate?.() || new Date(),
            updatedAt: doc.updatedAt?.toDate?.() || new Date(),
        };

        if (!DRY_RUN) {
            await prisma.job.upsert({
                where: { id: uuid },
                create: jobData,
                update: { updatedAt: jobData.updatedAt },
            });
        }
        count++;
    }

    console.log(`  ✅ Jobs migrated: ${count}${DRY_RUN ? ' (DRY RUN)' : ''}`);
    markComplete('jobs');
};

const migrateSavedJobs = async () => {
    if (checkpoint.completedCollections.includes('savedJobs')) {
        console.log('  ⏭  savedJobs — skipped (already complete)');
        return;
    }
    console.log('\n🔄 Migrating savedJobs (from users.savedJobs arrays)...');
    const users = await fetchCollection('users');
    let count = 0;
    let skipped = 0;

    for (const doc of users) {
        const userUUID = getUUID(doc.firestoreId);
        const savedJobIds = Array.isArray(doc.savedJobs) ? doc.savedJobs : [];

        for (const firestoreJobId of savedJobIds) {
            const jobUUID = checkpoint.idMap[firestoreJobId];
            if (!jobUUID) {
                console.warn(`  ⚠️  savedJob ref ${firestoreJobId} not found in idMap — skipping`);
                skipped++;
                continue;
            }

            if (!DRY_RUN) {
                await prisma.savedJob.upsert({
                    where: { userId_jobId: { userId: userUUID, jobId: jobUUID } },
                    create: { userId: userUUID, jobId: jobUUID },
                    update: {},
                });
            }
            count++;
        }
    }

    console.log(`  ✅ SavedJobs migrated: ${count}, skipped: ${skipped}${DRY_RUN ? ' (DRY RUN)' : ''}`);
    markComplete('savedJobs');
};

const migrateAiSuggestions = async () => {
    if (checkpoint.completedCollections.includes('aiSuggestions')) {
        console.log('  ⏭  aiSuggestions — skipped (already complete)');
        return;
    }
    console.log('\n🔄 Migrating aiSuggestions...');
    const docs = await fetchCollection('aiSuggestions');
    let count = 0;
    let skipped = 0;

    for (const doc of docs) {
        const resumeUUID = doc.resumeId ? checkpoint.idMap[doc.resumeId] : null;
        const jobUUID = doc.jobId ? checkpoint.idMap[doc.jobId] : null;

        if (!resumeUUID || !jobUUID) {
            console.warn(`  ⚠️  aiSuggestion missing refs — skipping`);
            skipped++;
            continue;
        }

        // Skip expired entries
        const expiresAt = doc.expiresAt?.toDate?.() || new Date(0);
        if (expiresAt < new Date()) {
            skipped++;
            continue;
        }

        if (!DRY_RUN) {
            await prisma.aiSuggestion.upsert({
                where: { resumeId_jobId: { resumeId: resumeUUID, jobId: jobUUID } },
                create: {
                    resumeId: resumeUUID,
                    jobId: jobUUID,
                    suggestions: doc.suggestions || {},
                    expiresAt,
                    createdAt: doc.createdAt?.toDate?.() || new Date(),
                },
                update: { suggestions: doc.suggestions || {}, expiresAt },
            });
        }
        count++;
    }

    console.log(`  ✅ AiSuggestions migrated: ${count}, skipped: ${skipped}${DRY_RUN ? ' (DRY RUN)' : ''}`);
    markComplete('aiSuggestions');
};

// ── Main ──────────────────────────────────────────────────────────────────────

const run = async () => {
    console.log('\n══════════════════════════════════════════════');
    console.log('  SkillSync AI — Firestore → PostgreSQL Migration');
    if (DRY_RUN) console.log('  🟡 DRY RUN MODE — no data will be written');
    console.log('══════════════════════════════════════════════\n');

    loadCheckpoint();

    const startTime = Date.now();

    try {
        // ORDER MATTERS — users must exist before resumes/savedJobs
        await migrateUsers();
        await migrateJobs();
        await migrateResumes();
        await migrateSavedJobs();
        await migrateAiSuggestions();

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n✅ Migration complete in ${elapsed}s`);

        if (!DRY_RUN) {
            console.log('\n📊 Final counts in PostgreSQL:');
            console.log(`  Users:         ${await prisma.user.count()}`);
            console.log(`  Resumes:       ${await prisma.resume.count()}`);
            console.log(`  Jobs:          ${await prisma.job.count()}`);
            console.log(`  Saved Jobs:    ${await prisma.savedJob.count()}`);
            console.log(`  AI Suggestions: ${await prisma.aiSuggestion.count()}`);

            // Clean up checkpoint file after successful run
            if (fs.existsSync(CHECKPOINT_FILE)) {
                fs.unlinkSync(CHECKPOINT_FILE);
                console.log('\n🗑  Checkpoint file removed (migration fully complete)');
            }
        }
    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        console.error('   Checkpoint saved. Re-run the script to resume from where it stopped.');
        console.error(err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

run();
