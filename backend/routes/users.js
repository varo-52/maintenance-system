const express = require('express');
const router = express.Router();
const pool = require('../database');
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getPositionByRole } = require('../utils/position');

// Get all users (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.query;
    let query =
      'SELECT id, full_name, email, phone, address, position, role, created_at FROM users';
    let params = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await pool.execute(query, params);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, full_name, email, phone, address, position, role, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Backfill missing position values for existing users (safety for old DB rows).
    if (!user.position) {
      const computedPosition = getPositionByRole(user.role);
      if (computedPosition) {
        await pool.execute('UPDATE users SET position = ? WHERE id = ?', [
          computedPosition,
          user.id,
        ]);
        user.position = computedPosition;
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new user (Admin only - for creating technicians)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fullName, email, password, role, phone, address, position } =
      req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['customer', 'technician', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if email exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const computedPosition = position || getPositionByRole(role);

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (full_name, email, password_hash, phone, address, position, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        fullName,
        email,
        passwordHash,
        phone || null,
        address || null,
        computedPosition,
        role,
      ]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.insertId,
        fullName,
        email,
        phone: phone || null,
        address: address || null,
        position: computedPosition,
        role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, phone, address, position } = req.body;

    const [result] = await pool.execute(
      'UPDATE users SET full_name = ?, email = ?, phone = ?, address = ?, position = ?, role = ? WHERE id = ?',
      [
        fullName,
        email,
        phone || null,
        address || null,
        position || getPositionByRole(role),
        role,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
