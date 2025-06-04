const express = require('express');
const router = express.Router();
const { sequelize } = require('../../config/database');

// Get all tables
router.get('/', async (req, res) => {
  try {
    const result = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    res.status(200).json({
      message: "Database tables retrieved successfully",
      tables: result[0]
    });
  } catch (error) {
    console.error('Error fetching database tables:', error);
    res.status(500).json({ 
      message: 'Error retrieving database tables',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get table structure
router.get('/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Query to get column information for the specified table
    const result = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = :tableName
      ORDER BY ordinal_position;
    `, {
      replacements: { tableName }
    });
    
    // If no columns found, table doesn't exist
    if (result[0].length === 0) {
      return res.status(404).json({
        message: `Table '${tableName}' not found`
      });
    }
    
    res.status(200).json({
      message: `Structure for table '${tableName}' retrieved successfully`,
      columns: result[0]
    });
  } catch (error) {
    console.error(`Error fetching structure for table:`, error);
    res.status(500).json({ 
      message: 'Error retrieving table structure',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;