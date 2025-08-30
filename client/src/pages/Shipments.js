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
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const statusColors = {
  'Pending': 'warning',
  'In Transit': 'info',
  'Delivered': 'success',
  'Cancelled': 'error'
};

const priorityColors = {
  'Standard': 'default',
  'Express': 'primary',
  'Priority': 'secondary'
};

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { isManager } = useAuth();

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    origin: '',
    destination: '',
    priority: 'Standard',
    weight: '',
    dimensions: '',
    description: ''
  });

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/shipments');
      setShipments(response.data);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      showSnackbar('Failed to load shipments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (shipment = null) => {
    if (shipment) {
      setEditingShipment(shipment);
      setFormData({
        customerName: shipment.customerName,
        customerEmail: shipment.customerEmail,
        customerPhone: shipment.customerPhone,
        origin: shipment.origin,
        destination: shipment.destination,
        priority: shipment.priority,
        weight: shipment.weight,
        dimensions: shipment.dimensions,
        description: shipment.description
      });
    } else {
      setEditingShipment(null);
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        origin: '',
        destination: '',
        priority: 'Standard',
        weight: '',
        dimensions: '',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingShipment(null);
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      origin: '',
      destination: '',
      priority: 'Standard',
      weight: '',
      dimensions: '',
      description: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingShipment) {
        await axios.put(`/api/shipments/${editingShipment.id}`, formData);
        showSnackbar('Shipment updated successfully', 'success');
      } else {
        await axios.post('/api/shipments', formData);
        showSnackbar('Shipment created successfully', 'success');
      }
      fetchShipments();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving shipment:', error);
      showSnackbar('Failed to save shipment', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shipment?')) {
      try {
        await axios.delete(`/api/shipments/${id}`);
        showSnackbar('Shipment deleted successfully', 'success');
        fetchShipments();
      } catch (error) {
        console.error('Error deleting shipment:', error);
        showSnackbar('Failed to delete shipment', 'error');
      }
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.patch(`/api/shipments/${id}/status`, { status });
      showSnackbar('Status updated successfully', 'success');
      fetchShipments();
    } catch (error) {
      console.error('Error updating status:', error);
      showSnackbar('Failed to update status', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredShipments = shipments.filter(shipment =>
    shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { field: 'trackingNumber', headerName: 'Tracking #', width: 130, flex: 1 },
    { field: 'customerName', headerName: 'Customer', width: 150, flex: 1 },
    { field: 'origin', headerName: 'Origin', width: 150, flex: 1 },
    { field: 'destination', headerName: 'Destination', width: 150, flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={statusColors[params.value] || 'default'}
          size="small"
        />
      )
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={priorityColors[params.value] || 'default'}
          size="small"
          variant="outlined"
        />
      )
    },
    { field: 'weight', headerName: 'Weight (kg)', width: 100, flex: 1 },
    { field: 'estimatedDelivery', headerName: 'Est. Delivery', width: 120, flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleOpenDialog(params.row)}>
              <ViewIcon />
            </IconButton>
          </Tooltip>
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
        <Typography variant="h4">Shipment Management</Typography>
        {isManager && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Shipment
          </Button>
        )}
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search shipments..."
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
          rows={filteredShipments}
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
          {editingShipment ? 'Edit Shipment' : 'New Shipment'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Email"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Phone"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="Standard">Standard</MenuItem>
                  <MenuItem value="Express">Express</MenuItem>
                  <MenuItem value="Priority">Priority</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Origin"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Weight (kg)"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dimensions"
                placeholder="L x W x H cm"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
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
            {editingShipment ? 'Update' : 'Create'}
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

export default Shipments;
