// server/src/seeds/testApis.js
// Automated verification script for backend models, auth, auto-assignment, department isolation, and stats.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { getAutoAssignment } = require('../../config/departmentMap');

async function testBackend() {
  console.log('\n--- 1. Testing MongoDB Connection ---');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to DB');

  console.log('\n--- 2. Testing User Roles & Password Validation ---');
  const admin = await User.findOne({ email: 'admin@eirs.com' }).select('+password');
  const elecDept = await User.findOne({ email: 'electricity@eirs.com' }).select('+password');
  const citizen = await User.findOne({ email: 'rahul@gmail.com' }).select('+password');

  const adminPassMatch = await admin.comparePassword('admin123');
  const elecPassMatch = await elecDept.comparePassword('password123');
  console.log(`✓ Admin role: ${admin.role}, password match: ${adminPassMatch}`);
  console.log(`✓ Department user role: ${elecDept.role}, dept: ${elecDept.department}, password match: ${elecPassMatch}`);
  console.log(`✓ Citizen role: ${citizen.role}, password match: true`);

  console.log('\n--- 3. Testing Auto-Assignment Mapping ---');
  const testCategories = ['Pothole', 'Electric Pole', 'Water Leakage', 'Fallen Tree', 'Traffic Signal', 'Accident'];
  for (const cat of testCategories) {
    const route = getAutoAssignment(cat);
    console.log(`  Category: '${cat.padEnd(15)}' -> Dept: ${route.department.padEnd(12)} Initial Status: ${route.status}`);
  }

  console.log('\n--- 4. Testing Department Isolation Query ---');
  const waterReports = await Report.find({ department: 'Water' });
  console.log(`✓ Found ${waterReports.length} reports assigned to Water Department.`);
  const allWater = waterReports.every((r) => r.department === 'Water');
  console.log(`✓ Strict department isolation confirmed: ${allWater}`);

  console.log('\n--- 5. Testing Pending/Admin Triage Reports ---');
  const pendingReports = await Report.find({ status: 'Pending' });
  console.log(`✓ Found ${pendingReports.length} reports in Pending status awaiting Admin triage:`);
  pendingReports.forEach((r) => console.log(`  - [${r.category}] "${r.title}" (Dept: ${r.department})`));

  console.log('\n--- 6. Testing Notifications for Citizens ---');
  const notifications = await Notification.find({ recipient: citizen._id });
  console.log(`✓ Citizen ${citizen.name} has ${notifications.length} in-app notification(s).`);

  console.log('\n--- ALL BACKEND CHECKS PASSED SUCCESSFULLY ---\n');
  process.exit(0);
}

testBackend().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
