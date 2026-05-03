# Service & Maintenance Management System - Backend

Backend API for the Service & Maintenance Management System using Node.js, Express, and MySQL.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Database

1. Create a `.env` file in the `backend` directory (copy from `.env.example`):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=service_maintenance_db
DB_PORT=3306

PORT=3000

JWT_SECRET=your_secret_key_here_change_in_production
```

2. Update the database credentials in `.env` file.

3. Create the database and tables by running the SQL schema:

```bash
mysql -u root -p < schema.sql
```

Or manually:
- Open MySQL command line or MySQL Workbench
- Run the SQL commands from `schema.sql`

### 3. Initialize Default Users

After creating the database, run:

```bash
node init-db.js
```

This will create default admin and technician users:
- **Admin**: admin@smarttech.com / admin123
- **Technician**: tech@smarttech.com / tech123

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login user

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/me` - Get current user profile
- `POST /api/users` - Create new user (admin/technician)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Products (Admin only for create/update/delete)
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Service Requests
- `GET /api/service-requests` - Get service requests (filtered by role)
- `GET /api/service-requests/:id` - Get single service request
- `POST /api/service-requests` - Create service request (Customer)
- `PUT /api/service-requests/:id/assign-technician` - Assign technician (Admin)
- `PUT /api/service-requests/:id/status` - Update status (Admin/Technician)
- `GET /api/service-requests/dashboard/stats` - Get dashboard statistics (Admin)

### Service Notes
- `GET /api/service-notes/service-request/:requestId` - Get notes for a request
- `POST /api/service-notes` - Create service note (Technician/Admin)

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_token_here>
```

## Testing the API

You can test the API using:
- Postman
- curl
- Browser (for GET requests)
- The frontend application

Example login request:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smarttech.com","password":"admin123"}'
```
