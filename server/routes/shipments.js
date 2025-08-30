const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Data file path
const shipmentsFile = path.join(__dirname, '../data/shipments.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.dirname(shipmentsFile);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Load shipments from file
const loadShipments = async () => {
  try {
    const data = await fs.readFile(shipmentsFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Save shipments to file
const saveShipments = async (shipments) => {
  await ensureDataDir();
  await fs.writeFile(shipmentsFile, JSON.stringify(shipments, null, 2));
};

// Initialize sample data
const initializeSampleData = async () => {
  const shipments = await loadShipments();
  if (shipments.length === 0) {
    const sampleShipments = [
      {
        id: uuidv4(),
        trackingNumber: 'TRK001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        status: 'In Transit',
        priority: 'Standard',
        weight: 25.5,
        dimensions: '30x20x15 cm',
        description: 'Electronics package',
        estimatedDelivery: '2024-01-15',
        actualDelivery: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        trackingNumber: 'TRK002',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '+1987654321',
        origin: 'Chicago, IL',
        destination: 'Miami, FL',
        status: 'Delivered',
        priority: 'Express',
        weight: 15.2,
        dimensions: '25x18x12 cm',
        description: 'Documents package',
        estimatedDelivery: '2024-01-10',
        actualDelivery: '2024-01-09',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    await saveShipments(sampleShipments);
  }
};

// Initialize on startup
initializeSampleData();

// Get all shipments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const shipments = await loadShipments();
    res.json(shipments);
  } catch (error) {
    console.error('Error loading shipments:', error);
    res.status(500).json({ error: 'Failed to load shipments' });
  }
});

// Get shipment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const shipments = await loadShipments();
    const shipment = shipments.find(s => s.id === id);
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.json(shipment);
  } catch (error) {
    console.error('Error loading shipment:', error);
    res.status(500).json({ error: 'Failed to load shipment' });
  }
});

// Create new shipment
router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      priority = 'Standard',
      weight,
      dimensions,
      description
    } = req.body;

    if (!customerName || !customerEmail || !origin || !destination) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const shipments = await loadShipments();
    const trackingNumber = `TRK${String(shipments.length + 1).padStart(3, '0')}`;
    
    const newShipment = {
      id: uuidv4(),
      trackingNumber,
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      status: 'Pending',
      priority,
      weight: weight || 0,
      dimensions: dimensions || '',
      description: description || '',
      estimatedDelivery: null,
      actualDelivery: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    shipments.push(newShipment);
    await saveShipments(shipments);

    res.status(201).json(newShipment);
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// Update shipment
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const shipments = await loadShipments();
    const shipmentIndex = shipments.findIndex(s => s.id === id);
    
    if (shipmentIndex === -1) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    shipments[shipmentIndex] = {
      ...shipments[shipmentIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await saveShipments(shipments);
    res.json(shipments[shipmentIndex]);
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

// Delete shipment
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const shipments = await loadShipments();
    const filteredShipments = shipments.filter(s => s.id !== id);
    
    if (filteredShipments.length === shipments.length) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    await saveShipments(filteredShipments);
    res.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    res.status(500).json({ error: 'Failed to delete shipment' });
  }
});

// Update shipment status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedDelivery, actualDelivery } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const shipments = await loadShipments();
    const shipmentIndex = shipments.findIndex(s => s.id === id);
    
    if (shipmentIndex === -1) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    shipments[shipmentIndex].status = status;
    if (estimatedDelivery) shipments[shipmentIndex].estimatedDelivery = estimatedDelivery;
    if (actualDelivery) shipments[shipmentIndex].actualDelivery = actualDelivery;
    shipments[shipmentIndex].updatedAt = new Date().toISOString();

    await saveShipments(shipments);
    res.json(shipments[shipmentIndex]);
  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({ error: 'Failed to update shipment status' });
  }
});

// Search shipments
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    const shipments = await loadShipments();
    
    const filteredShipments = shipments.filter(shipment => 
      shipment.trackingNumber.toLowerCase().includes(query.toLowerCase()) ||
      shipment.customerName.toLowerCase().includes(query.toLowerCase()) ||
      shipment.customerEmail.toLowerCase().includes(query.toLowerCase()) ||
      shipment.origin.toLowerCase().includes(query.toLowerCase()) ||
      shipment.destination.toLowerCase().includes(query.toLowerCase()) ||
      shipment.status.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json(filteredShipments);
  } catch (error) {
    console.error('Error searching shipments:', error);
    res.status(500).json({ error: 'Failed to search shipments' });
  }
});

module.exports = router;
