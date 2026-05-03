const express = require('express');
const router = express.Router();
const pool = require('../database');
const { authenticate, requireAdminOrTechnician } = require('../middleware/auth');

// Get notes for a service request
router.get('/service-request/:requestId', authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;

    const [notes] = await pool.execute(
      `SELECT sn.*, u.full_name as technician_name
       FROM service_notes sn
       LEFT JOIN users u ON sn.technician_id = u.id
       WHERE sn.service_request_id = ?
       ORDER BY sn.created_at DESC`,
      [requestId]
    );

    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create service note (Technician or Admin)
router.post('/', authenticate, requireAdminOrTechnician, async (req, res) => {
  try {
    const { serviceRequestId, noteText } = req.body;

    if (!serviceRequestId || !noteText) {
      return res.status(400).json({ error: 'Service request ID and note text are required' });
    }

    // Verify service request exists
    const [requests] = await pool.execute(
      'SELECT id FROM service_requests WHERE id = ?',
      [serviceRequestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Check if technician owns this request
    if (req.user.role === 'technician') {
      const [techRequests] = await pool.execute(
        'SELECT technician_id FROM service_requests WHERE id = ?',
        [serviceRequestId]
      );
      if (techRequests.length === 0 || techRequests[0].technician_id !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO service_notes (service_request_id, technician_id, note_text) VALUES (?, ?, ?)',
      [serviceRequestId, req.user.userId, noteText]
    );

    const [notes] = await pool.execute(
      `SELECT sn.*, u.full_name as technician_name
       FROM service_notes sn
       LEFT JOIN users u ON sn.technician_id = u.id
       WHERE sn.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Note added successfully',
      note: notes[0]
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
