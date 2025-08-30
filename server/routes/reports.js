const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Data file paths
const shipmentsFile = path.join(__dirname, '../data/shipments.json');
const inventoryFile = path.join(__dirname, '../data/inventory.json');
const customersFile = path.join(__dirname, '../data/customers.json');

// Load data functions
const loadShipments = async () => {
  try {
    const data = await fs.readFile(shipmentsFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const loadInventory = async () => {
  try {
    const data = await fs.readFile(inventoryFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const loadCustomers = async () => {
  try {
    const data = await fs.readFile(customersFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Dashboard summary
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const [shipments, inventory, customers] = await Promise.all([
      loadShipments(),
      loadInventory(),
      loadCustomers()
    ]);

    const totalShipments = shipments.length;
    const activeShipments = shipments.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled').length;
    const deliveredShipments = shipments.filter(s => s.status === 'Delivered').length;
    const totalInventoryItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.quantity <= item.reorderPoint).length;
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'Active').length;

    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalCustomerValue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);

    const summary = {
      shipments: {
        total: totalShipments,
        active: activeShipments,
        delivered: deliveredShipments,
        pending: shipments.filter(s => s.status === 'Pending').length,
        inTransit: shipments.filter(s => s.status === 'In Transit').length
      },
      inventory: {
        totalItems: totalInventoryItems,
        lowStock: lowStockItems,
        totalValue: totalInventoryValue.toFixed(2)
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        totalValue: totalCustomerValue.toFixed(2)
      },
      recentActivity: {
        lastShipment: shipments.length > 0 ? shipments[shipments.length - 1] : null,
        lastInventoryUpdate: inventory.length > 0 ? inventory[inventory.length - 1] : null
      }
    };

    res.json(summary);
  } catch (error) {
    console.error('Error generating dashboard report:', error);
    res.status(500).json({ error: 'Failed to generate dashboard report' });
  }
});

// Shipment analytics
router.get('/shipments', authenticateToken, async (req, res) => {
  try {
    const shipments = await loadShipments();
    
    const statusCounts = shipments.reduce((acc, shipment) => {
      acc[shipment.status] = (acc[shipment.status] || 0) + 1;
      return acc;
    }, {});

    const priorityCounts = shipments.reduce((acc, shipment) => {
      acc[shipment.priority] = (acc[shipment.priority] || 0) + 1;
      return acc;
    }, {});

    const monthlyData = shipments.reduce((acc, shipment) => {
      const month = new Date(shipment.createdAt).toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const analytics = {
      totalShipments: shipments.length,
      statusBreakdown: statusCounts,
      priorityBreakdown: priorityCounts,
      monthlyTrends: monthlyData,
      averageWeight: shipments.length > 0 ? 
        (shipments.reduce((sum, s) => sum + (s.weight || 0), 0) / shipments.length).toFixed(2) : 0,
      topDestinations: shipments.reduce((acc, shipment) => {
        acc[shipment.destination] = (acc[shipment.destination] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error generating shipment analytics:', error);
    res.status(500).json({ error: 'Failed to generate shipment analytics' });
  }
});

// Inventory analytics
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const inventory = await loadInventory();
    
    const categoryBreakdown = inventory.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const valueByCategory = inventory.reduce((acc, item) => {
      const category = item.category;
      acc[category] = (acc[category] || 0) + (item.quantity * item.unitPrice);
      return acc;
    }, {});

    const lowStockItems = inventory.filter(item => item.quantity <= item.reorderPoint);
    const outOfStockItems = inventory.filter(item => item.quantity === 0);

    const analytics = {
      totalItems: inventory.length,
      totalValue: inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2),
      categoryBreakdown,
      valueByCategory: Object.fromEntries(
        Object.entries(valueByCategory).map(([k, v]) => [k, v.toFixed(2)])
      ),
      stockStatus: {
        lowStock: lowStockItems.length,
        outOfStock: outOfStockItems.length,
        healthy: inventory.length - lowStockItems.length - outOfStockItems.length
      },
      topSuppliers: inventory.reduce((acc, item) => {
        acc[item.supplier] = (acc[item.supplier] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error generating inventory analytics:', error);
    res.status(500).json({ error: 'Failed to generate inventory analytics' });
  }
});

// Customer analytics
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const customers = await loadCustomers();
    
    const statusBreakdown = customers.reduce((acc, customer) => {
      acc[customer.status] = (acc[customer.status] || 0) + 1;
      return acc;
    }, {});

    const topCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(customer => ({
        id: customer.id,
        name: customer.name,
        company: customer.company,
        totalSpent: customer.totalSpent,
        totalOrders: customer.totalOrders
      }));

    const averageOrderValue = customers.length > 0 ? 
      (customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(2) : 0;

    const analytics = {
      totalCustomers: customers.length,
      statusBreakdown,
      topCustomers,
      averageOrderValue,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2),
      customerSegments: {
        highValue: customers.filter(c => c.totalSpent > 10000).length,
        mediumValue: customers.filter(c => c.totalSpent > 5000 && c.totalSpent <= 10000).length,
        lowValue: customers.filter(c => c.totalSpent <= 5000).length
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error generating customer analytics:', error);
    res.status(500).json({ error: 'Failed to generate customer analytics' });
  }
});

// Financial report
router.get('/financial', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const [shipments, inventory, customers] = await Promise.all([
      loadShipments(),
      loadInventory(),
      loadCustomers()
    ]);

    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalCustomerRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    
    // Calculate potential revenue from active shipments
    const activeShipments = shipments.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled');
    const potentialRevenue = activeShipments.reduce((sum, shipment) => {
      // Estimate revenue based on weight and priority
      const baseRate = shipment.priority === 'Express' ? 50 : 25;
      const weightRate = (shipment.weight || 0) * 2;
      return sum + baseRate + weightRate;
    }, 0);

    const financial = {
      assets: {
        inventory: totalInventoryValue.toFixed(2),
        accountsReceivable: totalCustomerRevenue.toFixed(2)
      },
      revenue: {
        total: totalCustomerRevenue.toFixed(2),
        potential: potentialRevenue.toFixed(2)
      },
      costs: {
        inventory: (totalInventoryValue * 0.6).toFixed(2), // Estimated cost at 60% of value
        operational: (totalCustomerRevenue * 0.3).toFixed(2) // Estimated operational costs at 30% of revenue
      },
      profit: {
        gross: (totalCustomerRevenue - (totalInventoryValue * 0.6)).toFixed(2),
        net: (totalCustomerRevenue - (totalInventoryValue * 0.6) - (totalCustomerRevenue * 0.3)).toFixed(2)
      }
    };

    res.json(financial);
  } catch (error) {
    console.error('Error generating financial report:', error);
    res.status(500).json({ error: 'Failed to generate financial report' });
  }
});

// Export data
router.get('/export/:type', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { type } = req.params;
    let data;
    let filename;

    switch (type) {
      case 'shipments':
        data = await loadShipments();
        filename = 'shipments-export.json';
        break;
      case 'inventory':
        data = await loadInventory();
        filename = 'inventory-export.json';
        break;
      case 'customers':
        data = await loadCustomers();
        filename = 'customers-export.json';
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(data);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;
