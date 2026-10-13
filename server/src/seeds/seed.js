// server/src/seeds/seed.js
// Database seeder script to populate initial users, department officers, and sample emergency reports.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { getAutoAssignment } = require('../../config/departmentMap');

// Create minimal valid 1x1 PNG for image placeholders if not present
const createPlaceholderImage = (filename) => {
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    // Minimal valid 1x1 PNG buffer
    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a7e4ffa60000000049454e44ae426082',
      'hex'
    );
    fs.writeFileSync(filePath, pngBuffer);
  }
};

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Connected successfully.');

    // Prepare demo image files in /uploads
    createPlaceholderImage('sample-pothole.jpg');
    createPlaceholderImage('sample-electric.jpg');
    createPlaceholderImage('sample-water.jpg');
    createPlaceholderImage('sample-tree.jpg');
    createPlaceholderImage('sample-garbage.jpg');
    createPlaceholderImage('sample-traffic.jpg');
    createPlaceholderImage('sample-resolved-proof.jpg');

    // Clear existing data
    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Report.deleteMany({});
    await Notification.deleteMany({});

    // 1. Create Admin
    const admin = await User.create({
      name: 'Municipal Admin Officer',
      email: 'admin@eirs.com',
      password: 'admin123',
      phone: '+91 9876543210',
      role: 'admin',
      department: null,
    });
    console.log('✓ Created Admin: admin@eirs.com / admin123');

    // 2. Create 7 Department Users
    const departments = [
      { name: 'Road Officer', email: 'road@eirs.com', dept: 'Road' },
      { name: 'Water Works Officer', email: 'water@eirs.com', dept: 'Water' },
      { name: 'Electricity Officer', email: 'electricity@eirs.com', dept: 'Electricity' },
      { name: 'Drainage Officer', email: 'drainage@eirs.com', dept: 'Drainage' },
      { name: 'Tree & Horticulture Officer', email: 'tree@eirs.com', dept: 'Tree' },
      { name: 'Fire Response Officer', email: 'fire@eirs.com', dept: 'Fire' },
      { name: 'Sanitation Officer', email: 'sanitation@eirs.com', dept: 'Sanitation' },
    ];

    const departmentUsers = {};
    for (const d of departments) {
      const user = await User.create({
        name: d.name,
        email: d.email,
        password: 'password123',
        phone: '+91 980000000' + departments.indexOf(d),
        role: 'department',
        department: d.dept,
      });
      departmentUsers[d.dept] = user;
      console.log(`✓ Created Department User: ${d.email} / password123 [${d.dept}]`);
    }

    // 3. Create 2 Citizens
    const citizen1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      password: 'citizen123',
      phone: '+91 9123456789',
      role: 'citizen',
      department: null,
    });

    const citizen2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@gmail.com',
      password: 'citizen123',
      phone: '+91 9988776655',
      role: 'citizen',
      department: null,
    });
    console.log('✓ Created Citizens: rahul@gmail.com & priya@gmail.com / citizen123');

    // 4. Create Sample Reports
    console.log('[Seed] Creating sample reports with status history...');

    const sampleReports = [
      {
        title: 'Dangerous Deep Pothole on MG Road',
        description: 'Large crater near Metro Pillar 142. Vehicles swerving sharply to avoid accidents.',
        category: 'Pothole',
        severity: 'High',
        location: {
          latitude: 12.9756,
          longitude: 77.6066,
          address: 'MG Road near Metro Pillar 142, Bengaluru',
        },
        imageUrl: '/uploads/sample-pothole.jpg',
        citizen: citizen1._id,
      },
      {
        title: 'Sparks and Exposed Wire on Electric Pole',
        description: 'Sparks flying from transformer box during morning rain. Threat of electrocution.',
        category: 'Electric Pole',
        severity: 'Critical',
        location: {
          latitude: 12.9352,
          longitude: 77.6245,
          address: '8th Main, 4th Block, Koramangala, Bengaluru',
        },
        imageUrl: '/uploads/sample-electric.jpg',
        citizen: citizen2._id,
      },
      {
        title: 'Major Water Pipeline Burst',
        description: 'Potable water overflowing onto street at 200 liters/minute. Road flooding.',
        category: 'Water Leakage',
        severity: 'Critical',
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Opposite Cubbon Park Gate 3, Bengaluru',
        },
        imageUrl: '/uploads/sample-water.jpg',
        citizen: citizen1._id,
      },
      {
        title: 'Uprooted Banyan Tree Blocking Lane',
        description: 'Heavy storm knocked down tree completely blocking two-way vehicular movement.',
        category: 'Fallen Tree',
        severity: 'High',
        location: {
          latitude: 12.9279,
          longitude: 77.5824,
          address: '33rd Cross Road, Jayanagar 7th Block, Bengaluru',
        },
        imageUrl: '/uploads/sample-tree.jpg',
        citizen: citizen2._id,
      },
      {
        title: 'Severe Clogged Open Drain Overflowing',
        description: 'Sewage water spilling over pavement near school entrance. Health hazard.',
        category: 'Drainage',
        severity: 'Medium',
        location: {
          latitude: 12.9892,
          longitude: 77.5512,
          address: 'Rajajinagar 2nd Stage, Bengaluru',
        },
        imageUrl: '/uploads/sample-water.jpg',
        citizen: citizen1._id,
      },
      {
        title: 'Overflowing Garbage Dump near Market',
        description: 'Garbage heap accumulated for 5 days. Foul smell and stray animal menace.',
        category: 'Garbage',
        severity: 'Low',
        location: {
          latitude: 12.9698,
          longitude: 77.7499,
          address: 'Whitefield Main Road Market, Bengaluru',
        },
        imageUrl: '/uploads/sample-garbage.jpg',
        citizen: citizen2._id,
      },
      {
        title: 'Traffic Signals Damaged at Junction',
        description: 'All 4 signal lights blinking dead after thunderstorm. Severe traffic jam.',
        category: 'Traffic Signal', // Unmapped! Should be Pending / Admin Triage
        severity: 'High',
        location: {
          latitude: 12.9172,
          longitude: 77.6228,
          address: 'Silk Board Junction Flyover Ramp, Bengaluru',
        },
        imageUrl: '/uploads/sample-traffic.jpg',
        citizen: citizen1._id,
      },
      {
        title: 'Cracked Expansion Joint on Bridge',
        description: 'Vibrations felt when heavy trucks pass over bridge joint.',
        category: 'Bridge Damage', // Unmapped! Should be Pending / Admin Triage
        severity: 'Critical',
        location: {
          latitude: 12.9591,
          longitude: 77.6974,
          address: 'Marathahalli Old Airport Road Bridge, Bengaluru',
        },
        imageUrl: '/uploads/sample-pothole.jpg',
        citizen: citizen2._id,
      },
    ];

    for (const rData of sampleReports) {
      const { department, status } = getAutoAssignment(rData.category);

      const history = [
        {
          status,
          changedBy: rData.citizen,
          role: 'citizen',
          note:
            department !== 'Unassigned'
              ? `Report auto-assigned to ${department} Department based on category '${rData.category}'`
              : `Category '${rData.category}' unmapped. Awaiting Admin triage`,
          timestamp: new Date(Date.now() - 3600000 * 24), // 24 hours ago
        },
      ];

      let resolvedProofUrl = null;
      let resolvedAt = null;
      let workNotes = '';
      let feedback = { rating: null, comment: '', submittedAt: null };

      // Let's set some reports as 'In Progress' and 'Resolved' for realistic dashboard testing!
      let finalStatus = status;

      if (rData.category === 'Water Leakage') {
        // Mark as In Progress by Water Department
        finalStatus = 'In Progress';
        workNotes = 'Repair crew dispatched with excavator and replacement 6-inch pipe valves.';
        history.push({
          status: 'In Progress',
          changedBy: departmentUsers['Water']._id,
          role: 'department',
          note: workNotes,
          timestamp: new Date(Date.now() - 3600000 * 12),
        });
      } else if (rData.category === 'Fallen Tree') {
        // Mark as Resolved by Tree Department
        finalStatus = 'Resolved';
        workNotes = 'Tree trunk chopped and cleared using chainsaws. Road reopened for traffic.';
        resolvedProofUrl = '/uploads/sample-resolved-proof.jpg';
        resolvedAt = new Date(Date.now() - 3600000 * 2);
        history.push(
          {
            status: 'In Progress',
            changedBy: departmentUsers['Tree']._id,
            role: 'department',
            note: 'Horticulture crew on site with tree-cutting equipment.',
            timestamp: new Date(Date.now() - 3600000 * 10),
          },
          {
            status: 'Resolved',
            changedBy: departmentUsers['Tree']._id,
            role: 'department',
            note: workNotes,
            timestamp: resolvedAt,
          }
        );
        feedback = {
          rating: 5,
          comment: 'Quick response! Cleared within hours. Thank you Tree Department!',
          submittedAt: new Date(Date.now() - 3600000 * 1),
        };
      }

      const report = await Report.create({
        ...rData,
        department,
        status: finalStatus,
        workNotes,
        resolvedProofUrl,
        resolvedAt,
        statusHistory: history,
        feedback,
      });

      // Notification for citizen
      await Notification.create({
        recipient: rData.citizen,
        report: report._id,
        title: `Report Update: ${report.title}`,
        message: `Status is currently '${finalStatus}' in department '${department}'.`,
      });
    }

    console.log('✓ Successfully seeded reports with status histories and coordinates!');
    console.log('\n================ SEED COMPLETE ================');
    console.log('Credentials:');
    console.log('  Admin:       admin@eirs.com       / admin123');
    console.log('  Department:  road@eirs.com        / password123');
    console.log('  Department:  water@eirs.com       / password123');
    console.log('  Department:  electricity@eirs.com / password123');
    console.log('  Department:  drainage@eirs.com    / password123');
    console.log('  Department:  tree@eirs.com        / password123');
    console.log('  Department:  fire@eirs.com        / password123');
    console.log('  Department:  sanitation@eirs.com  / password123');
    console.log('  Citizen 1:   rahul@gmail.com      / citizen123');
    console.log('  Citizen 2:   priya@gmail.com      / citizen123');
    console.log('================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedDatabase();
