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
  Low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200',
  High: 'bg-orange-50 text-orange-800 border-orange-200',
  Critical: 'bg-red-50 text-red-800 border-red-200',
};

export const STATUS_COLORS = {
  Pending: 'bg-slate-100 text-slate-700 border-slate-300',
  Assigned: 'bg-blue-50 text-blue-800 border-blue-200',
  'In Progress': 'bg-amber-50 text-amber-800 border-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export const DEPARTMENT_COLORS = {
  Road: 'bg-slate-50 text-slate-700 border-slate-200',
  Water: 'bg-slate-50 text-slate-700 border-slate-200',
  Electricity: 'bg-slate-50 text-slate-700 border-slate-200',
  Drainage: 'bg-slate-50 text-slate-700 border-slate-200',
  Tree: 'bg-slate-50 text-slate-700 border-slate-200',
  Fire: 'bg-slate-50 text-slate-700 border-slate-200',
  Sanitation: 'bg-slate-50 text-slate-700 border-slate-200',
  Unassigned: 'bg-slate-100 text-slate-600 border-slate-200',
};
