import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import {
  LocalShipping,
  Inventory,
  People,
  TrendingUp,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reports/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const shipmentData = [
    { name: 'Pending', value: dashboardData.shipments.pending, color: '#FF9800' },
    { name: 'In Transit', value: dashboardData.shipments.inTransit, color: '#2196F3' },
    { name: 'Delivered', value: dashboardData.shipments.delivered, color: '#4CAF50' }
  ];

  const inventoryData = [
    { name: 'Healthy', value: dashboardData.inventory.totalItems - dashboardData.inventory.lowStock, color: '#4CAF50' },
    { name: 'Low Stock', value: dashboardData.inventory.lowStock, color: '#FF9800' }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard Overview
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Shipments"
            value={dashboardData.shipments.total}
            icon={<LocalShipping sx={{ fontSize: 30, color: '#1976d2' }} />}
            color="#1976d2"
            subtitle={`${dashboardData.shipments.active} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Inventory Items"
            value={dashboardData.inventory.totalItems}
            icon={<Inventory sx={{ fontSize: 30, color: '#388e3c' }} />}
            color="#388e3c"
            subtitle={`$${dashboardData.inventory.totalValue} total value`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Customers"
            value={dashboardData.customers.total}
            icon={<People sx={{ fontSize: 30, color: '#f57c00' }} />}
            color="#f57c00"
            subtitle={`${dashboardData.customers.active} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${dashboardData.customers.totalValue}`}
            icon={<TrendingUp sx={{ fontSize: 30, color: '#7b1fa2' }} />}
            color="#7b1fa2"
            subtitle="From all customers"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Shipments Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Shipment Status Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height="300px">
              <PieChart>
                <Pie
                  data={shipmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {shipmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Inventory Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Inventory Stock Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height="300px">
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {dashboardData.recentActivity.lastShipment && (
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" p={2} sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                <LocalShipping sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2">
                    Latest Shipment: {dashboardData.recentActivity.lastShipment.trackingNumber}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {dashboardData.recentActivity.lastShipment.customerName} → {dashboardData.recentActivity.lastShipment.destination}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
          {dashboardData.recentActivity.lastInventoryUpdate && (
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" p={2} sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                <Inventory sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="subtitle2">
                    Latest Inventory Update: {dashboardData.recentActivity.lastInventoryUpdate.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Quantity: {dashboardData.recentActivity.lastInventoryUpdate.quantity}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Alerts */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Alerts
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {dashboardData.inventory.lowStock > 0 && (
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" p={2} sx={{ bgcolor: 'warning.light', borderRadius: 1 }}>
                <Warning sx={{ mr: 2, color: 'warning.dark' }} />
                <Typography variant="subtitle2" color="warning.dark">
                  {dashboardData.inventory.lowStock} items are running low on stock
                </Typography>
              </Box>
            </Grid>
          )}
          {dashboardData.shipments.pending > 0 && (
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" p={2} sx={{ bgcolor: 'info.light', borderRadius: 1 }}>
                <LocalShipping sx={{ mr: 2, color: 'info.dark' }} />
                <Typography variant="subtitle2" color="info.dark">
                  {dashboardData.shipments.pending} shipments pending processing
                </Typography>
              </Box>
            </Grid>
          )}
          {dashboardData.inventory.lowStock === 0 && dashboardData.shipments.pending === 0 && (
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" p={2} sx={{ bgcolor: 'success.light', borderRadius: 1 }}>
                <CheckCircle sx={{ mr: 2, color: 'success.dark' }} />
                <Typography variant="subtitle2" color="success.dark">
                  All systems are running smoothly
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;
