// server/src/models/Report.js
// Defines the Report schema with statusHistory, department assignment,
// proof of work image, GPS accuracy, live camera timestamp, collaborative confirmations, and feedback.

const mongoose = require('mongoose');

// Sub-schema for tracking each step in the resolution lifecycle
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  role: {
    type: String,
    enum: ['citizen', 'department', 'admin'],
  },
  note: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Sub-schema for crowd-sourced extra photo and GPS confirmations on active reports
const confirmationSchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number,
    required: true,
  },
  capturedAt: {
    type: Date,
    default: Date.now,
  },
});

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Emergency description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Pothole',
          'Fallen Tree',
          'Electric Pole',
          'Water Leakage',
          'Drainage',
          'Traffic Signal',
          'Bridge Damage',
          'Fire',
          'Garbage',
          'Accident',
          'Other',
        ],
        message: 'Invalid emergency category',
      },
    },
    severity: {
      type: String,
      required: [true, 'Severity level is required'],
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: 'Severity must be Low, Medium, High, or Critical',
      },
      default: 'Medium',
    },
    location: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
      },
      address: {
        type: String,
        default: 'Location specified via GPS pin',
      },
      // GeoJSON format for MongoDB spatial indexing & proximity search
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
      },
    },
    // Anti-fraud GPS accuracy metric (must be <= 100 meters)
    accuracy: {
      type: Number,
      required: [true, 'GPS accuracy is required'],
      default: 10,
    },
    // Anti-fraud Live Camera timestamp (must be within 2 minutes of server time)
    capturedAt: {
      type: Date,
      required: [true, 'Camera capture timestamp is required'],
      default: Date.now,
    },
    imageUrl: {
      type: String,
      required: [true, 'Evidence photo is required'],
    },
    resolvedProofUrl: {
      type: String,
      default: null, // Uploaded by department officer upon resolution
    },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
      default: 'Pending',
    },
    department: {
      type: String,
      enum: [
        'Road',
        'Water',
        'Electricity',
        'Drainage',
        'Tree',
        'Fire',
        'Sanitation',
        'Unassigned',
      ],
      default: 'Unassigned',
    },
    // Primary/Original submitter
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Collaborative list of all citizens who reported or confirmed this incident
    reportedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Total count of citizen confirmations
    reportCount: {
      type: Number,
      default: 1,
    },
    // Additional evidence photos and GPS captured by other citizens
    confirmations: [confirmationSchema],
    adminNotes: {
      type: String,
      default: '',
    },
    workNotes: {
      type: String,
      default: '',
    },
    // Audit timeline of all status updates
    statusHistory: [statusHistorySchema],
    resolvedAt: {
      type: Date,
      default: null,
    },
    // Citizen rating and review after resolution
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        default: '',
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure GeoJSON coordinates array is synchronized with lat/lng
reportSchema.pre('save', function (next) {
  if (this.location && this.location.latitude != null && this.location.longitude != null) {
    this.location.coordinates = [this.location.longitude, this.location.latitude];
  }
  // Ensure primary citizen is included in reportedBy
  if (this.citizen && (!this.reportedBy || this.reportedBy.length === 0)) {
    this.reportedBy = [this.citizen];
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);
