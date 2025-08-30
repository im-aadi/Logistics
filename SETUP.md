# Logistics Management System - Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Git

## Quick Start

### Option 1: Using the batch file (Windows)
1. Double-click `start.bat`
2. Wait for dependencies to install
3. The system will start automatically

### Option 2: Manual setup

1. **Install backend dependencies:**
   ```bash
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Start the system:**
   ```bash
   npm run dev
   ```

## What Gets Started

- **Backend Server**: http://localhost:5000
- **Frontend App**: http://localhost:3000
- **API Documentation**: http://localhost:5000/api/health

## Default Login Credentials

- **Username**: admin
- **Password**: admin123

## Features Available

### 🚚 Shipment Management
- Create, edit, delete shipments
- Track shipment status
- Set priorities (Standard, Express, Priority)
- Search and filter shipments

### 📦 Inventory Management
- Add/edit inventory items
- Track stock levels
- Set reorder points
- Monitor low stock items

### 👥 Customer Management
- Manage customer information
- Track customer orders and spending
- Customer segmentation by value

### 📊 Reports & Analytics
- Dashboard overview
- Shipment analytics
- Inventory reports
- Customer insights
- Financial reports (managers only)

### 🔐 User Management
- Role-based access control
- Admin, Manager, and User roles
- Secure authentication with JWT

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Shipments
- `GET /api/shipments` - List all shipments
- `POST /api/shipments` - Create new shipment
- `PUT /api/shipments/:id` - Update shipment
- `DELETE /api/shipments/:id` - Delete shipment
- `PATCH /api/shipments/:id/status` - Update status

### Inventory
- `GET /api/inventory` - List all items
- `POST /api/inventory` - Add new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `PATCH /api/inventory/:id/quantity` - Update quantity

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Add new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Reports
- `GET /api/reports/dashboard` - Dashboard summary
- `GET /api/reports/shipments` - Shipment analytics
- `GET /api/reports/inventory` - Inventory analytics
- `GET /api/reports/customers` - Customer analytics
- `GET /api/reports/financial` - Financial reports

## Data Storage

The system uses JSON files for data storage:
- `server/data/users.json` - User accounts
- `server/data/shipments.json` - Shipment data
- `server/data/inventory.json` - Inventory data
- `server/data/customers.json` - Customer data

## Customization

### Adding New Features
1. Create new route files in `server/routes/`
2. Add new components in `client/src/components/`
3. Update the main App.js routing
4. Add new menu items in Layout.js

### Styling
- Uses Material-UI theme system
- Customize colors in `client/src/index.js`
- Modify component styles using sx prop

### Database Migration
To migrate to a real database:
1. Replace file operations in route files
2. Update data models
3. Add database connection logic

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in package.json or .env
   - Kill existing processes on ports 3000/5000

2. **Dependencies not installing**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and package-lock.json
   - Run `npm install` again

3. **Frontend not connecting to backend**
   - Check proxy setting in client/package.json
   - Ensure backend is running on port 5000
   - Check CORS settings

4. **Authentication issues**
   - Clear browser localStorage
   - Check JWT_SECRET in environment
   - Verify token expiration

### Performance Tips

1. **For large datasets**
   - Implement pagination in API endpoints
   - Add database indexing
   - Use virtual scrolling in data grids

2. **For production**
   - Use environment variables for secrets
   - Implement rate limiting
   - Add request validation
   - Set up proper logging

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- CORS protection
- Input validation
- Secure headers

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Mobile Responsiveness

The system is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Support

For issues or questions:
1. Check the console for error messages
2. Review the API responses
3. Check network tab for failed requests
4. Verify all dependencies are installed

## License

MIT License - Feel free to modify and distribute!
