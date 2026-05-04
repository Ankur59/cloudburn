import mongoose from 'mongoose';
import User from '../src/models/user.model.js';
import Organization from '../src/models/organization.model.js';
import { connectDB } from '../src/config/db.js';

const inspect = async () => {
  await connectDB();
  const users = await User.find({}).populate('orgId');
  console.log('--- Users in Database ---');
  users.forEach(u => {
    console.log(`User: ${u.name} (${u.email}) | OrgId: ${u.orgId?._id} | OrgName: ${u.orgId?.name}`);
  });
  process.exit(0);
};

inspect();
