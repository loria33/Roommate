# Railway Deployment Guide

## Overview

This backend is configured for deployment on Railway with the production URL: `matalkoperationalbe-production.up.railway.app`

## Configuration Updates Made

### 1. CORS Configuration

- Added Railway production URLs to allowed origins
- Added support for `FRONTEND_URL` environment variable
- Configured to work with both internal and external Railway URLs

### 2. Server Configuration

- Updated to listen on `0.0.0.0` (all interfaces) instead of localhost
- Fixed PORT parsing to handle Railway's dynamic port assignment
- Added proper TypeScript type safety

### 3. Docker Configuration

- Updated Dockerfile to use `$PORT` environment variable
- Added Railway-specific health checks
- Created `railway.json` for Railway deployment configuration

## Environment Variables

Make sure to set these environment variables in Railway:

- `PORT` - Railway will set this automatically
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `FRONTEND_URL` - Your frontend URL (optional, for CORS)
- `NODE_ENV` - Set to "production"

## Deployment Steps

1. **Connect your repository to Railway**

   - Railway will automatically detect the Dockerfile
   - The `railway.json` file provides additional configuration

2. **Set Environment Variables**

   - Go to your Railway project settings
   - Add the required environment variables

3. **Deploy**
   - Railway will automatically build and deploy using the Dockerfile
   - Health checks will run at `/health` endpoint

## Health Check

The application includes a health check endpoint at `/health` that Railway will use to monitor the service.

## URLs

- **Production URL**: `https://matalkoperationalbe-production.up.railway.app`
- **Internal URL**: `matalkoperationalbe.railway.internal`
- **Health Check**: `https://matalkoperationalbe-production.up.railway.app/health`

## Troubleshooting

1. **Check logs**: Use Railway's log viewer to debug issues
2. **Health check failures**: Verify the `/health` endpoint is responding
3. **Database connection**: Ensure `DATABASE_URL` is correctly set
4. **CORS issues**: Check that frontend URLs are in the allowed origins list
