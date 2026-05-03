// Script to initialize database with default users
// Run this after creating the database schema
// node init-db.js

const bcrypt = require('bcryptjs');
const pool = require('./database');
const { getPositionByRole } = require('./utils/position');

async function initDatabase() {
  try {
    console.log('Initializing database with default users...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const techPassword = await bcrypt.hash('tech123', 10);

    // Insert or update admin user
    await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, position, role) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash),
       position = VALUES(position)`,
      [
        'Admin User',
        'admin@smarttech.com',
        adminPassword,
        getPositionByRole('admin'),
        'admin',
      ]
    );

    // Insert or update technician user
    await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, position, role) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash),
       position = VALUES(position)`,
      [
        'Technician One',
        'tech@smarttech.com',
        techPassword,
        getPositionByRole('technician'),
        'technician',
      ]
    );

    // Fill missing positions for any existing rows (backward compatible).
    await pool.execute(
      `UPDATE users
       SET position = CASE role
         WHEN 'customer' THEN 'Customer'
         WHEN 'technician' THEN 'Technician'
         WHEN 'admin' THEN 'Admin'
         ELSE position
       END
       WHERE position IS NULL OR position = ''`
    );

    console.log('✅ Default users initialized successfully!');
    console.log('Admin: admin@smarttech.com / admin123');
    console.log('Technician: tech@smarttech.com / tech123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
