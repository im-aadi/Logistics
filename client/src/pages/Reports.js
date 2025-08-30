import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Divider
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Download as DownloadIcon,
  TrendingUp,
  Inventory,
  People,
  LocalShipping
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Reports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [shipmentData, setShipmentData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isManager } = useAuth();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [shipments, inventory, customers, financial] = await Promise.all([
        axios.get('/api/reports/shipments'),
        axios.get('/api/reports/inventory'),
        axios.get('/api/reports/customers'),
        isManager ? axios.get('/api/reports/financial') : Promise.resolve({ data: null })
      ]);

      setShipmentData(shipments.data);
      setInventoryData(inventory.data);
      setCustomerData(customers.data);
      setFinancialData(financial.data);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      setError('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleExport = async (type) => {
    try {
      const response = await axios.get(`/api/reports/export/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-export.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Reports & Analytics</Typography>
        {isManager && (
          <Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('shipments')}
              sx={{ mr: 1 }}
            >
              Export Shipments
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('inventory')}
              sx={{ mr: 1 }}
            >
              Export Inventory
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('customers')}
            >
              Export Customers
            </Button>
          </Box>
        )}
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Shipments" icon={<LocalShipping />} />
          <Tab label="Inventory" icon={<Inventory />} />
          <Tab label="Customers" icon={<People />} />
          {isManager && <Tab label="Financial" icon={<TrendingUp />} />}
        </Tabs>
      </Paper>

      {/* Shipments Tab */}
      {activeTab === 0 && shipmentData && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '400px' }}>
                <Typography variant="h6" gutterBottom>
                  Shipment Status Distribution
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height="300px">
                  <PieChart>
                    <Pie
                      data={Object.entries(shipmentData.statusBreakdown).map(([key, value]) => ({
                        name: key,
                        value
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(shipmentData.statusBreakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '400px' }}>
                <Typography variant="h6" gutterBottom>
                  Priority Distribution
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height="300px">
                  <BarChart data={Object.entries(shipmentData.priorityBreakdown).map(([key, value]) => ({
                    priority: key,
                    count: value
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Monthly Trends
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height="300px">
                  <LineChart data={Object.entries(shipmentData.monthlyTrends).map(([month, count]) => ({
                    month,
                    shipments: count
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="shipments" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Inventory Tab */}
      {activeTab === 1 && inventoryData && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '400px' }}>
                <Typography variant="h6" gutterBottom>
                  Category Breakdown
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height="300px">
                  <PieChart>
                    <Pie
                      data={Object.entries(inventoryData.categoryBreakdown).map(([key, value]) => ({
                        name: key,
                        value
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(inventoryData.categoryBreakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '400px' }}>
                <Typography variant="h6" gutterBottom>
                  Stock Status
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height="300px">
                  <BarChart data={[
                    { status: 'Healthy', count: inventoryData.stockStatus.healthy },
                    { status: 'Low Stock', count: inventoryData.stockStatus.lowStock },
                    { status: 'Out of Stock', count: inventoryData.stockStatus.outOfStock }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82CA9D" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Value by Category
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height="300px">
                  <BarChart data={Object.entries(inventoryData.valueByCategory).map(([category, value]) => ({
                    category,
                    value: parseFloat(value)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="value" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Customers Tab */}
      {activeTab === 2 && customerData && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '400px' }}>
                <Typography variant="h6" gutterBottom>
                  Customer Status
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height="300px">
                  <PieChart>
                    <Pie
                      data={Object.entries(customerData.statusBreakdown).map(([key, value]) => ({
                        name: key,
                        value
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(customerData.statusBreakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '400px' }}>
                <Typography variant="h6" gutterBottom>
                  Customer Segments
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height="300px">
                  <BarChart data={[
                    { segment: 'High Value', count: customerData.customerSegments.highValue },
                    { segment: 'Medium Value', count: customerData.customerSegments.mediumValue },
                    { segment: 'Low Value', count: customerData.customerSegments.lowValue }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Customers by Revenue
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height="300px">
                  <BarChart data={customerData.topCustomers.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="totalSpent" fill="#8884D8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Financial Tab */}
      {activeTab === 3 && financialData && isManager && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '400px' }}>
                <Typography variant="h6" gutterBottom>
                  Assets Overview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height="300px">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Inventory', value: parseFloat(financialData.assets.inventory) },
                        { name: 'Accounts Receivable', value: parseFloat(financialData.assets.accountsReceivable) }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#0088FE" />
                      <Cell fill="#00C49F" />
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '400px' }}>
                <Typography variant="h6" gutterBottom>
                  Revenue vs Costs
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height="300px">
                  <BarChart data={[
                    { category: 'Revenue', amount: parseFloat(financialData.revenue.total) },
                    { category: 'Inventory Costs', amount: parseFloat(financialData.costs.inventory) },
                    { category: 'Operational Costs', amount: parseFloat(financialData.costs.operational) }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="amount" fill="#82CA9D" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Profit Analysis
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Gross Profit
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          ${financialData.profit.gross}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Net Profit
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          ${financialData.profit.net}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Total Revenue
                        </Typography>
                        <Typography variant="h5">
                          ${financialData.revenue.total}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Potential Revenue
                        </Typography>
                        <Typography variant="h5" color="info.main">
                          ${financialData.revenue.potential}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default Reports;
