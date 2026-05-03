const express = require('express');
const router = express.Router();
const pool = require('../database');
const { authenticate, requireAdmin, requireAdminOrTechnician } = require('../middleware/auth');

// Generate service code
function generateServiceCode() {
  return `SR-${Date.now().toString().slice(-6)}`;
}

// Get all service requests
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, technicianId, customerId } = req.query;
    let query = `
      SELECT sr.*, 
             u1.full_name as customer_name,
             u2.full_name as technician_name,
             p.name as product_name
      FROM service_requests sr
      LEFT JOIN users u1 ON sr.customer_id = u1.id
      LEFT JOIN users u2 ON sr.technician_id = u2.id
      LEFT JOIN products p ON sr.product_id = p.id
      WHERE 1=1
    `;
    let params = [];

    // Filter by role
    if (req.user.role === 'customer') {
      query += ' AND sr.customer_id = ?';
      params.push(req.user.userId);
    } else if (req.user.role === 'technician') {
      query += ' AND sr.technician_id = ?';
      params.push(req.user.userId);
    }

    // Additional filters
    if (status) {
      query += ' AND sr.status = ?';
      params.push(status);
    }
    if (technicianId && req.user.role === 'admin') {
      query += ' AND sr.technician_id = ?';
      params.push(technicianId);
    }
    if (customerId && req.user.role === 'admin') {
      query += ' AND sr.customer_id = ?';
      params.push(customerId);
    }

    query += ' ORDER BY sr.created_at DESC';

    const [requests] = await pool.execute(query, params);
    res.json(requests);
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single service request
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const [requests] = await pool.execute(
      `SELECT sr.*, 
              u1.full_name as customer_name,
              u2.full_name as technician_name,
              p.name as product_name, p.model as product_model
       FROM service_requests sr
       LEFT JOIN users u1 ON sr.customer_id = u1.id
       LEFT JOIN users u2 ON sr.technician_id = u2.id
       LEFT JOIN products p ON sr.product_id = p.id
       WHERE sr.id = ?`,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Check permissions
    const request = requests[0];
    if (req.user.role === 'customer' && request.customer_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role === 'technician' && request.technician_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(request);
  } catch (error) {
    console.error('Get service request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create service request (Customer only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can create service requests' });
    }

    const { productId, requestDate, problemDesc, serviceFee } = req.body;

    if (!requestDate || !problemDesc) {
      return res.status(400).json({ error: 'Request date and problem description are required' });
    }

    const serviceCode = generateServiceCode();

    const [result] = await pool.execute(
      'INSERT INTO service_requests (service_code, customer_id, product_id, request_date, problem_desc, service_fee, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [serviceCode, req.user.userId, productId || null, requestDate, problemDesc, serviceFee || null, 'Pending']
    );

    const [requests] = await pool.execute(
      `SELECT sr.*, 
              u1.full_name as customer_name,
              p.name as product_name
       FROM service_requests sr
       LEFT JOIN users u1 ON sr.customer_id = u1.id
       LEFT JOIN products p ON sr.product_id = p.id
       WHERE sr.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Service request created successfully',
      request: requests[0]
    });
  } catch (error) {
    console.error('Create service request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign technician to service request (Admin only)
router.put('/:id/assign-technician', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    const [result] = await pool.execute(
      'UPDATE service_requests SET technician_id = ? WHERE id = ?',
      [technicianId || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    res.json({ message: 'Technician assigned successfully' });
  } catch (error) {
    console.error('Assign technician error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update service request status (Admin or Technician)
router.put('/:id/status', authenticate, requireAdminOrTechnician, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if technician owns this request
    if (req.user.role === 'technician') {
      const [requests] = await pool.execute(
        'SELECT technician_id FROM service_requests WHERE id = ?',
        [id]
      );
      if (requests.length === 0 || requests[0].technician_id !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [result] = await pool.execute(
      'UPDATE service_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get dashboard statistics (Admin only)
router.get('/dashboard/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [userStats] = await pool.execute(`
      SELECT 
        COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers_count,
        COUNT(CASE WHEN role = 'technician' THEN 1 END) as technicians_count
      FROM users
    `);

    const [productStats] = await pool.execute(`
      SELECT COUNT(*) as products_count FROM products
    `);

    const [requestStats] = await pool.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_count,
        COUNT(*) as total_requests
      FROM service_requests
    `);

    res.json({
      customers_count: userStats[0].customers_count || 0,
      technicians_count: userStats[0].technicians_count || 0,
      products_count: productStats[0].products_count || 0,
      pending_count: requestStats[0].pending_count || 0,
      in_progress_count: requestStats[0].in_progress_count || 0,
      completed_count: requestStats[0].completed_count || 0,
      total_requests: requestStats[0].total_requests || 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
