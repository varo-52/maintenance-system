# Service & Maintenance Management System - Setup Guide

Complete setup instructions for connecting the frontend to MySQL database backend.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Step 1: Database Setup

1. **Start MySQL server** (if not already running)

2. **Create the database and tables**:
   ```bash
   mysql -u root -p < backend/schema.sql
   ```
   
   Or manually:
   - Open MySQL command line or MySQL Workbench
   - Run the SQL commands from `backend/schema.sql`

3. **Initialize default users**:
   ```bash
   cd backend
   node init-db.js
   ```
   
   This creates:
   - **Admin**: admin@smarttech.com / admin123
   - **Technician**: tech@smarttech.com / tech123

## Step 2: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env` (if it doesn't exist, create it)
   - Update the database credentials:
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_mysql_password
     DB_NAME=service_maintenance_db
     DB_PORT=3306
     
     PORT=3000
     
     JWT_SECRET=your_secret_key_here_change_in_production
     ```

4. **Start the backend server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```
   
   The server will run on `http://localhost:3000`

## Step 3: Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Open `index.html` in a web browser**:
   - You can use a simple HTTP server or open directly
   - For development, you can use VS Code Live Server extension
   - Or use Python's HTTP server:
     ```bash
     python -m http.server 8000
     ```
     Then open `http://localhost:8000` in your browser

3. **Important**: Make sure the backend server is running before using the frontend!

## Step 4: Testing

1. **Test the API**:
   - Open browser console (F12)
   - Check for any connection errors
   - Try logging in with:
     - Admin: admin@smarttech.com / admin123
     - Technician: tech@smarttech.com / tech123

2. **Test features**:
   - Register a new customer account
   - Create a service request (as customer)
   - Assign technician (as admin)
   - Update request status (as technician/admin)
   - Add products (as admin)

## Troubleshooting

### Backend won't start
- Check if MySQL is running
- Verify database credentials in `.env`
- Make sure the database exists: `service_maintenance_db`

### Frontend can't connect to API
- Make sure backend is running on port 3000
- Check browser console for CORS errors
- Verify `API_BASE_URL` in `frontend/api.js` is `http://localhost:3000/api`

### Database connection errors
- Verify MySQL is running: `mysql -u root -p`
- Check database exists: `SHOW DATABASES;`
- Verify user permissions

### Authentication errors
- Make sure you ran `node init-db.js` to create default users
- Check JWT_SECRET in `.env` file

## Project Structure

```
introToDatabase/
├── backend/
│   ├── routes/          # API route handlers
│   ├── middleware/      # Auth middleware
│   ├── database.js     # MySQL connection pool
│   ├── server.js       # Express server
│   ├── schema.sql      # Database schema
│   ├── init-db.js      # Initialize default users
│   └── package.json
├── frontend/
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Styles
│   ├── api.js          # API client functions
│   ├── app-api.js      # Main app logic (connected to API)
│   └── app.js          # Old localStorage version (backup)
└── SETUP.md            # This file
```

## API Endpoints

- `POST /api/auth/register` - Register customer
- `POST /api/auth/login` - Login
- `GET /api/users` - Get users (Admin)
- `GET /api/products` - Get products
- `POST /api/products` - Create product (Admin)
- `GET /api/service-requests` - Get service requests
- `POST /api/service-requests` - Create request (Customer)
- `PUT /api/service-requests/:id/assign-technician` - Assign technician (Admin)
- `PUT /api/service-requests/:id/status` - Update status
- `GET /api/service-requests/dashboard/stats` - Dashboard stats (Admin)

See `backend/README.md` for complete API documentation.
