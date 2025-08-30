const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Data file path
const inventoryFile = path.join(__dirname, '../data/inventory.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.dirname(inventoryFile);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Load inventory from file
const loadInventory = async () => {
  try {
    const data = await fs.readFile(inventoryFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Save inventory to file
const saveInventory = async (inventory) => {
  await ensureDataDir();
  await fs.writeFile(inventoryFile, JSON.stringify(inventory, null, 2));
};

// Initialize sample data
const initializeSampleData = async () => {
  const inventory = await loadInventory();
  if (inventory.length === 0) {
    const sampleInventory = [
      {
        id: uuidv4(),
        sku: 'INV001',
        name: 'Laptop Computer',
        category: 'Electronics',
        description: 'High-performance laptop for business use',
        quantity: 50,
        unitPrice: 999.99,
        supplier: 'TechCorp Inc.',
        location: 'Warehouse A - Shelf 1',
        reorderPoint: 10,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        sku: 'INV002',
        name: 'Office Chair',
        category: 'Furniture',
        description: 'Ergonomic office chair with adjustable features',
        quantity: 25,
        unitPrice: 299.99,
        supplier: 'OfficeFurn Co.',
        location: 'Warehouse B - Shelf 3',
        reorderPoint: 5,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        sku: 'INV003',
        name: 'Printer Paper',
        category: 'Office Supplies',
        description: 'A4 printer paper, 500 sheets per ream',
        quantity: 200,
        unitPrice: 12.99,
        supplier: 'PaperPlus Ltd.',
        location: 'Warehouse A - Shelf 5',
        reorderPoint: 50,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
    await saveInventory(sampleInventory);
  }
};

// Initialize on startup
initializeSampleData();

// Get all inventory items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const inventory = await loadInventory();
    res.json(inventory);
  } catch (error) {
    console.error('Error loading inventory:', error);
    res.status(500).json({ error: 'Failed to load inventory' });
  }
});

// Get inventory item by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await loadInventory();
    const item = inventory.find(i => i.id === id);
    
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error loading inventory item:', error);
    res.status(500).json({ error: 'Failed to load inventory item' });
  }
});

// Create new inventory item
router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const {
      sku,
      name,
      category,
      description,
      quantity,
      unitPrice,
      supplier,
      location,
      reorderPoint
    } = req.body;

    if (!sku || !name || !category || quantity === undefined || unitPrice === undefined) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const inventory = await loadInventory();
    
    // Check if SKU already exists
    if (inventory.find(item => item.sku === sku)) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    
    const newItem = {
      id: uuidv4(),
      sku,
      name,
      category,
      description: description || '',
      quantity: parseInt(quantity) || 0,
      unitPrice: parseFloat(unitPrice) || 0,
      supplier: supplier || '',
      location: location || '',
      reorderPoint: parseInt(reorderPoint) || 0,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    inventory.push(newItem);
    await saveInventory(inventory);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const inventory = await loadInventory();
    const itemIndex = inventory.findIndex(i => i.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check if SKU is being changed and if it already exists
    if (updates.sku && updates.sku !== inventory[itemIndex].sku) {
      const existingItem = inventory.find(item => item.sku === updates.sku);
      if (existingItem) {
        return res.status(400).json({ error: 'SKU already exists' });
      }
    }

    inventory[itemIndex] = {
      ...inventory[itemIndex],
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    await saveInventory(inventory);
    res.json(inventory[itemIndex]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await loadInventory();
    const filteredInventory = inventory.filter(i => i.id !== id);
    
    if (filteredInventory.length === inventory.length) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    await saveInventory(filteredInventory);
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Update inventory quantity
router.patch('/:id/quantity', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    const inventory = await loadInventory();
    const itemIndex = inventory.findIndex(i => i.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    let newQuantity;
    switch (operation) {
      case 'add':
        newQuantity = inventory[itemIndex].quantity + parseInt(quantity);
        break;
      case 'subtract':
        newQuantity = inventory[itemIndex].quantity - parseInt(quantity);
        break;
      case 'set':
      default:
        newQuantity = parseInt(quantity);
        break;
    }

    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    inventory[itemIndex].quantity = newQuantity;
    inventory[itemIndex].lastUpdated = new Date().toISOString();

    await saveInventory(inventory);
    res.json(inventory[itemIndex]);
  } catch (error) {
    console.error('Error updating inventory quantity:', error);
    res.status(500).json({ error: 'Failed to update inventory quantity' });
  }
});

// Get low stock items
router.get('/low-stock/items', authenticateToken, async (req, res) => {
  try {
    const inventory = await loadInventory();
    const lowStockItems = inventory.filter(item => 
      item.quantity <= item.reorderPoint
    );
    
    res.json(lowStockItems);
  } catch (error) {
    console.error('Error loading low stock items:', error);
    res.status(500).json({ error: 'Failed to load low stock items' });
  }
});

// Search inventory
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    const inventory = await loadInventory();
    
    const filteredInventory = inventory.filter(item => 
      item.sku.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.supplier.toLowerCase().includes(query.toLowerCase()) ||
      item.location.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json(filteredInventory);
  } catch (error) {
    console.error('Error searching inventory:', error);
    res.status(500).json({ error: 'Failed to search inventory' });
  }
});

module.exports = router;
