// Maps user role to a default "position" value stored in the database.
// Adjust strings here if you want Arabic (or any other wording).
function getPositionByRole(role) {
  const normalizedRole = String(role || '').toLowerCase();
  const map = {
    customer: 'Customer',
    technician: 'Technician',
    admin: 'Admin',
  };
  return map[normalizedRole] || null;
}

module.exports = { getPositionByRole };

