# Logistics Management System

A comprehensive logistics management system built with React frontend and Node.js backend.

## Features

- **Shipment Management**: Create, track, and manage shipments
- **Inventory Management**: Track warehouse inventory and stock levels
- **Route Optimization**: Plan and optimize delivery routes
- **Customer Management**: Manage customer information and orders
- **Real-time Tracking**: Track shipments in real-time
- **Reporting & Analytics**: Generate reports and analyze logistics data
- **User Authentication**: Secure login and role-based access control
- **Mobile Responsive**: Works on all devices

## Tech Stack

- **Frontend**: React.js, Material-UI, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: JSON-based storage (can be easily migrated to MongoDB/PostgreSQL)
- **Authentication**: JWT tokens
- **File Upload**: Multer for document handling

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Project Structure

```
logistics/
├── client/          # React frontend
├── server/          # Node.js backend
├── data/            # JSON data storage
└── docs/            # Documentation
```

## API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/shipments` - Get all shipments
- `POST /api/shipments` - Create new shipment
- `PUT /api/shipments/:id` - Update shipment
- `DELETE /api/shipments/:id` - Delete shipment
- `GET /api/inventory` - Get inventory data
- `GET /api/customers` - Get customer data
- `GET /api/reports` - Generate reports

## Contributing

1. Fork the repository.
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request.
