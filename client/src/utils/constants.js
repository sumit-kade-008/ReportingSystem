// client/src/utils/constants.js
// Common categories, departments, colors, and badge helpers for EIRS.

export const CATEGORIES = [
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
];

export const DEPARTMENTS = [
  'Road',
  'Water',
  'Electricity',
  'Drainage',
  'Tree',
  'Fire',
  'Sanitation',
];

export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

export const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Resolved'];

export const SEVERITY_COLORS = {
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Medium: 'bg-amber-100 text-amber-800 border-amber-300',
  High: 'bg-orange-100 text-orange-800 border-orange-300',
  Critical: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
};

export const STATUS_COLORS = {
  Pending: 'bg-purple-100 text-purple-800 border-purple-300',
  Assigned: 'bg-blue-100 text-blue-800 border-blue-300',
  'In Progress': 'bg-amber-100 text-amber-800 border-amber-300',
  Resolved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export const DEPARTMENT_COLORS = {
  Road: 'bg-orange-50 text-orange-700 border-orange-200',
  Water: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Electricity: 'bg-amber-50 text-amber-700 border-amber-200',
  Drainage: 'bg-teal-50 text-teal-700 border-teal-200',
  Tree: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Fire: 'bg-red-50 text-red-700 border-red-200',
  Sanitation: 'bg-lime-50 text-lime-700 border-lime-200',
  Unassigned: 'bg-gray-100 text-gray-700 border-gray-300',
};
