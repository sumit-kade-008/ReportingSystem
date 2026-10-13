// server/config/departmentMap.js
// Configuration for automatic department assignment based on emergency category.

/**
 * Direct lookup dictionary mapping emergency categories to departments.
 * Categories not listed here (Traffic Signal, Bridge Damage, Accident, Other)
 * are considered unmapped and routed to Admin triage.
 */
const CATEGORY_DEPARTMENT_MAP = {
  'Pothole': 'Road',
  'Road': 'Road',
  'Electric Pole': 'Electricity',
  'Water Leakage': 'Water',
  'Drainage': 'Drainage',
  'Fallen Tree': 'Tree',
  'Fire': 'Fire',
  'Garbage': 'Sanitation',
};

/**
 * Determines the department and initial status for a newly submitted emergency.
 * 
 * VIVA EXPLANATION:
 * - If category exists in the map:
 *     department = mapped department (e.g. 'Electricity')
 *     status = 'Assigned' (immediately ready for the department team to act on)
 * - If category is unmapped or unknown:
 *     department = 'Unassigned'
 *     status = 'Pending' (sent to municipal Admin triage queue)
 * 
 * @param {string} category - The emergency category submitted by citizen
 * @returns {{ department: string, status: string }}
 */
const getAutoAssignment = (category) => {
  const department = CATEGORY_DEPARTMENT_MAP[category];

  if (department) {
    return {
      department,
      status: 'Assigned',
    };
  }

  return {
    department: 'Unassigned',
    status: 'Pending',
  };
};

module.exports = {
  CATEGORY_DEPARTMENT_MAP,
  getAutoAssignment,
};
