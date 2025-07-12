# ZeroGate Production Deployment Guide

## Prerequisites

- Docker and Docker Compose
- SSL certificates (for HTTPS)
- Domain name configured with DNS

## Environment Setup

1. **Create production environment file:**
   ```bash
   cp server/.env.production.example server/.env.production
   ```

2. **Update environment variables:**
   - `JWT_SECRET`: Generate a strong secret key
   - `CORS_ORIGIN`: Set to your frontend domain
   - `VITE_API_BASE_URL`: Set to your backend API URL

## Production Deployment

### Option 1: Docker Compose (Recommended)

1. **Build and start services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Check service health:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   curl http://localhost:3001/health
   curl http://localhost/health
   ```

### Option 2: Individual Docker Containers

1. **Build server image:**
   ```bash
   cd server
   docker build -f Dockerfile.production -t zerogate-server:latest .
   ```

2. **Build client image:**
   ```bash
   cd client
   docker build -f Dockerfile.production -t zerogate-client:latest .
   ```

3. **Run containers:**
   ```bash
   # Server
   docker run -d \
     --name zerogate-server \
     --env-file server/.env.production \
     -p 3001:3001 \
     -v $(pwd)/circuits:/app/circuits:ro \
     zerogate-server:latest

   # Client
   docker run -d \
     --name zerogate-client \
     -p 80:80 \
     zerogate-client:latest
   ```

### Option 3: Manual Deployment

1. **Server deployment:**
   ```bash
   cd server
   npm ci --only=production
   npm run build:prod
   NODE_ENV=production npm start
   ```

2. **Client deployment:**
   ```bash
   cd client
   npm ci
   npm run build
   # Deploy dist/ folder to your web server
   ```

## SSL/TLS Configuration

### Using Let's Encrypt with Certbot

1. **Install certbot:**
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Obtain certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com -d api.your-domain.com
   ```

3. **Auto-renewal:**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Monitoring and Logging

### Health Checks

- Server: `GET /health`
- Client: `GET /health`

### Log Management

Logs are stored in Docker volumes:
```bash
# View server logs
docker logs zerogate-server-prod

# View nginx logs
docker logs zerogate-client-prod
```

### Monitoring with Docker

```bash
# Check resource usage
docker stats

# View container health
docker-compose -f docker-compose.prod.yml ps
```

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env.production` to version control
   - Use strong, unique JWT secrets
   - Rotate secrets regularly

2. **Network Security:**
   - Use HTTPS in production
   - Configure proper CORS origins
   - Enable rate limiting

3. **Container Security:**
   - Run containers as non-root users
   - Regularly update base images
   - Scan images for vulnerabilities

## Performance Optimization

1. **Client Optimization:**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement proper caching headers

2. **Server Optimization:**
   - Use PM2 for process management
   - Configure load balancing
   - Monitor memory usage

## Backup and Recovery

1. **Circuit Files:**
   ```bash
   # Backup circuit artifacts
   tar -czf circuits-backup.tar.gz circuits/
   ```

2. **Configuration:**
   ```bash
   # Backup environment config
   cp server/.env.production backups/
   ```

## Troubleshooting

### Common Issues

1. **Proof verification failing:**
   - Check circuit files are properly copied
   - Verify file permissions
   - Check server logs for errors

2. **CORS errors:**
   - Verify CORS_ORIGIN environment variable
   - Check client API base URL

3. **Container startup issues:**
   - Check Docker logs
   - Verify environment variables
   - Ensure proper file permissions

### Debug Commands

```bash
# Check container logs
docker logs -f zerogate-server-prod

# Execute shell in container
docker exec -it zerogate-server-prod sh

# Check circuit files
docker exec zerogate-server-prod ls -la /app/circuits/

# Test API endpoints
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"proof": {}, "publicInputs": [], "secret": "test"}'
```

## Scaling

### Horizontal Scaling

1. **Load Balancer Configuration:**
   ```nginx
   upstream zerogate_backend {
       server zerogate-server-1:3001;
       server zerogate-server-2:3001;
       server zerogate-server-3:3001;
   }
   ```

2. **Database Considerations:**
   - Currently uses file-based storage
   - Consider migrating to Redis/PostgreSQL for multi-instance deployments

### Vertical Scaling

- Monitor CPU and memory usage
- Adjust Docker resource limits
- Optimize Node.js heap size

## Updates and Maintenance

1. **Application Updates:**
   ```bash
   # Pull latest code
   git pull origin main
   
   # Rebuild and restart
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Security Updates:**
   ```bash
   # Update base images
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Support

- Check logs first: `docker logs <container-name>`
- Verify health endpoints are responding
- Review environment configuration
- Check network connectivity between services
