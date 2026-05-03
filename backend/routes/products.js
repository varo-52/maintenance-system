const express = require('express');
const router = express.Router();
const pool = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all products
router.get('/', authenticate, async (req, res) => {
  try {
    const { customerId } = req.query;
    let query = 'SELECT * FROM products';
    let params = [];

    if (customerId) {
      query += ' WHERE customer_id = ?';
      params.push(customerId);
    }

    query += ' ORDER BY created_at DESC';

    const [products] = await pool.execute(query, params);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single product
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      model,
      serialNo,
      description,
      warrantyPeriod,
      purchaseDate,
      customerId,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO products (name, model, serial_no, description, warranty_period, purchase_date, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        model || null,
        serialNo || null,
        description || null,
        warrantyPeriod || null,
        purchaseDate || null,
        customerId || null,
      ]
    );

    const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Product created successfully',
      product: products[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      model,
      serialNo,
      description,
      warrantyPeriod,
      purchaseDate,
      customerId,
    } = req.body;

    const [result] = await pool.execute(
      'UPDATE products SET name = ?, model = ?, serial_no = ?, description = ?, warranty_period = ?, purchase_date = ?, customer_id = ? WHERE id = ?',
      [
        name,
        model || null,
        serialNo || null,
        description || null,
        warrantyPeriod || null,
        purchaseDate || null,
        customerId || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
