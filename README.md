# Matalk Operational Backend

A Node.js TypeScript backend API that connects to a Neon PostgreSQL database and provides endpoints for reading database tables and health checks.

## Features

- **Express.js** with TypeScript
- **Neon PostgreSQL** database integration
- **CORS** enabled for frontend integration
- **Environment variables** for configuration
- **Health check** and monitoring endpoints
- **Error handling** and logging

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Neon PostgreSQL database account
- Database connection string

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Update the `.env` file with your Neon database connection string:

   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   PORT=3001
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

## API Endpoints

### Health Check

- **GET** `/health`
- Returns server status and timestamp
- **Response:**
  ```json
  {
    "status": "OK",
    "timestamp": "2023-12-01T10:00:00.000Z"
  }
  ```

### Wakeup Endpoint

- **GET** `/wakeup`
- Simple endpoint to check if the server is running
- **Response:**
  ```json
  {
    "message": "Server is awake and running!",
    "timestamp": "2023-12-01T10:00:00.000Z",
    "status": "OK"
  }
  ```

### Read Endpoint

- **GET** `/read`
- Reads all tables from the connected Neon database
- **Response:**
  ```json
  {
    "message": "Database tables read successfully",
    "timestamp": "2023-12-01T10:00:00.000Z",
    "tables": ["users", "products", "orders"],
    "data": {
      "users": [{ "id": 1, "name": "John Doe", "email": "john@example.com" }],
      "products": [{ "id": 1, "name": "Product 1", "price": 99.99 }]
    }
  }
  ```

### Root Endpoint

- **GET** `/`
- Returns API information and available endpoints
- **Response:**
  ```json
  {
    "message": "Matalk Operational Backend API",
    "version": "1.0.0",
    "endpoints": {
      "health": "/health",
      "wakeup": "/wakeup",
      "read": "/read"
    },
    "timestamp": "2023-12-01T10:00:00.000Z"
  }
  ```

## Project Structure

```
src/
├── server.ts      # Main Express server
├── routes.ts      # Route handlers for endpoints
└── database.ts    # Database connection and utilities
```

## Database Configuration

The application uses the `pg` library to connect to Neon PostgreSQL:

- **Connection Pool**: Manages database connections efficiently
- **SSL Support**: Configured for Neon's SSL requirements
- **Error Handling**: Graceful handling of database errors
- **Query Limits**: Read endpoint limits results to 100 rows per table

## Environment Variables

- `DATABASE_URL`: Neon PostgreSQL connection string
- `PORT`: Server port (default: 3001)

## Development

### Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Start production server
- `npm test`: Run tests (to be implemented)

### TypeScript Configuration

The project uses TypeScript with strict type checking and modern ES2020 features. The configuration is in `tsconfig.json`.

## Error Handling

The application includes comprehensive error handling:

- **Database Errors**: Graceful handling of connection and query errors
- **Route Errors**: Proper HTTP status codes and error messages
- **Global Error Handler**: Catches unhandled errors
- **404 Handler**: Returns helpful error messages for unknown routes

## Security

- **CORS**: Enabled for cross-origin requests
- **Input Validation**: Basic validation for database queries
- **Error Messages**: Sanitized error responses
- **SSL**: Required for Neon database connections

## Monitoring

- **Health Check**: `/health` endpoint for monitoring
- **Logging**: Console logging for debugging
- **Timestamps**: All responses include timestamps

## Deployment

For production deployment:

1. Set up environment variables
2. Build the application: `npm run build`
3. Start the server: `npm start`
4. Use a process manager like PM2 for production

## Troubleshooting

### Common Issues

1. **Database Connection Error**: Check your `DATABASE_URL` in `.env`
2. **Port Already in Use**: Change the `PORT` in `.env`
3. **TypeScript Errors**: Run `npm run build` to check for compilation errors

### Logs

The application logs important events to the console:

- Server startup information
- Database connection status
- Error details for debugging
