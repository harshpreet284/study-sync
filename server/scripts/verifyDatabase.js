import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { Resource } from '../models/Resource.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyDatabase() {
  await connectDB();

  console.log('\n--- Database Inspection ---');

  // List all collections in DB
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections present in database:', collections.map(c => c.name));

  // Count resources
  const resourceCount = await Resource.countDocuments();
  console.log(`Total Resource documents count: ${resourceCount}`);

  // Fetch two representative documents
  const sample1 = await Resource.findOne({ sourceId: 27 }).lean(); // Rust book
  const sample2 = await Resource.findOne({ sourceId: 14 }).lean(); // Go tutorial

  console.log('\nRepresentative Document 1 (sourceId 27 - Book):');
  console.log(JSON.stringify(sample1, null, 2));

  console.log('\nRepresentative Document 2 (sourceId 14 - Tutorial):');
  console.log(JSON.stringify(sample2, null, 2));

  await disconnectDB();
}

verifyDatabase();
