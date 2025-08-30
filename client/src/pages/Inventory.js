import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const stockStatusColors = {
  'healthy': 'success',
  'low': 'warning',
  'out': 'error'
};

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { isManager } = useAuth();

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    description: '',
    quantity: '',
    unitPrice: '',
    supplier: '',
    location: '',
    reorderPoint: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showSnackbar('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        sku: item.sku,
        name: item.name,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        supplier: item.supplier,
        location: item.location,
        reorderPoint: item.reorderPoint
      });
    } else {
      setEditingItem(null);
      setFormData({
        sku: '',
        name: '',
        category: '',
        description: '',
        quantity: '',
        unitPrice: '',
        supplier: '',
        location: '',
        reorderPoint: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({
      sku: '',
      name: '',
      category: '',
      description: '',
      quantity: '',
      unitPrice: '',
      supplier: '',
      location: '',
      reorderPoint: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await axios.put(`/api/inventory/${editingItem.id}`, formData);
        showSnackbar('Inventory item updated successfully', 'success');
      } else {
        await axios.post('/api/inventory', formData);
        showSnackbar('Inventory item created successfully', 'success');
      }
      fetchInventory();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      showSnackbar('Failed to save inventory item', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await axios.delete(`/api/inventory/${id}`);
        showSnackbar('Inventory item deleted successfully', 'success');
        fetchInventory();
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        showSnackbar('Failed to delete inventory item', 'error');
      }
    }
  };

  const getStockStatus = (quantity, reorderPoint) => {
    if (quantity === 0) return 'out';
    if (quantity <= reorderPoint) return 'low';
    return 'healthy';
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredInventory = inventory.filter(item =>
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.quantity <= item.reorderPoint);
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const columns = [
    { field: 'sku', headerName: 'SKU', width: 120, flex: 1 },
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'category', headerName: 'Category', width: 120, flex: 1 },
    { field: 'quantity', headerName: 'Quantity', width: 100, flex: 1 },
    { field: 'unitPrice', headerName: 'Unit Price', width: 120, flex: 1, 
      valueFormatter: (params) => `$${params.value}` },
    { field: 'supplier', headerName: 'Supplier', width: 150, flex: 1 },
    { field: 'location', headerName: 'Location', width: 150, flex: 1 },
    {
      field: 'stockStatus',
      headerName: 'Stock Status',
      width: 120,
      flex: 1,
      renderCell: (params) => {
        const status = getStockStatus(params.row.quantity, params.row.reorderPoint);
        return (
          <Chip
            label={status === 'out' ? 'Out of Stock' : status === 'low' ? 'Low Stock' : 'Healthy'}
            color={stockStatusColors[status]}
            size="small"
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {isManager && (
            <>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => handleOpenDialog(params.row)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Inventory Management</Typography>
        {isManager && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Item
          </Button>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h4">
                {inventory.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h4">
                ${totalValue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Low Stock Items
              </Typography>
              <Typography variant="h4" color="warning.main">
                {lowStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Categories
              </Typography>
              <Typography variant="h4">
                {new Set(inventory.map(item => item.category)).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredInventory}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Inventory Item' : 'New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reorder Point"
                type="number"
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventory;
