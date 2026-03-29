# Production Deployment Guide

Instructions for deploying HEJ PAPA to production environments.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] JWT secret is secure and unique
- [ ] CORS origins are restricted to production domain
- [ ] Database is backed up
- [ ] SSL/TLS certificates are valid
- [ ] API rate limiting is configured
- [ ] Monitoring and logging is set up
- [ ] Tests pass locally

## Backend Deployment

### Option 1: Heroku (Recommended for Quick Start)

#### 1. Create Heroku Account
- Sign up at https://www.heroku.com

#### 2. Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
https://devcenter.heroku.com/articles/heroku-cli

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

#### 3. Login to Heroku
```bash
heroku login
```

#### 4. Create Heroku App
```bash
cd backend
heroku create your-app-name
```

#### 5. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

#### 6. Deploy
```bash
git push heroku main
# or: git push heroku master
```

#### 7. Verify Deployment
```bash
heroku open
# Should open: https://your-app-name.herokuapp.com
# Test: https://your-app-name.herokuapp.com/api/health
```

#### 8. View Logs
```bash
heroku logs --tail
```

### Option 2: AWS EC2

#### 1. Launch EC2 Instance
- Ubuntu 20.04 LTS, t3.micro (free tier eligible)
- Security group: Allow ports 80, 443, 22

#### 2. SSH into Instance
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 3. Install Dependencies
```bash
sudo apt update
sudo apt install -y nodejs npm git curl

# Verify
node --version
npm --version
```

#### 4. Clone Repository
```bash
git clone https://github.com/your-repo/aplikacja.git
cd aplikacja/backend
npm install
```

#### 5. Setup Environment
```bash
cp .env.example .env

# Edit .env with production values
nano .env
```

Set:
- `NODE_ENV=production`
- `JWT_SECRET=<secure-key>`
- `ALLOWED_ORIGINS=https://your-domain.com`

#### 6. Setup PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 start src/server.js --name "hej-papa-api"
pm2 startup
pm2 save
```

#### 7. Setup Nginx Reverse Proxy
```bash
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl restart nginx
```

#### 8. Setup SSL Certificate (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: DigitalOcean

Similar to AWS but simpler:

```bash
# 1. Create Droplet (Ubuntu 20.04)
# 2. SSH in
ssh root@your-droplet-ip

# 3. Run setup script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. Deploy with Docker (optional, or use PM2 like AWS)
# ... continue as AWS option above
```

## Mobile App / Web Deployment

### Option 1: Expo Web Deployment

#### 1. Build Static Export
```bash
cd mobile
npm run build:web
```

Creates `dist/` folder with static files.

#### 2. Deploy to Services

**Vercel (Recommended)**
```bash
npm install -g vercel
vercel --prod
```

**Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**AWS S3 + CloudFront**
```bash
# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/

# CloudFront will serve with CDN
```

### Option 2: Heroku Web Deployment

```bash
# Create separate Heroku app for web
heroku create your-app-web

# Build and deploy
npm run build:web
git add dist/
git commit -m "Build web app"
git push heroku main
```

### Option 3: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Mobile build
COPY mobile/package*.json ./mobile/
RUN cd mobile && npm install && npm run build:web

EXPOSE 3000 3001

CMD ["node", "backend/src/server.js"]
```

Build and run:
```bash
docker build -t hej-papa .
docker run -p 3000:3000 -e "JWT_SECRET=..." hej-papa
```

## Database Management

### SQLite (Development)
- File-based: `data/tata.db`
- Local only, no backup needed for development

### PostgreSQL (Production)

#### 1. Setup Database
```bash
# On Heroku
heroku addons:create heroku-postgresql:hobby-dev

# Or on AWS
aws rds create-db-instance \
  --db-instance-identifier hej-papa-db \
  --db-instance-class db.t3.micro \
  --engine postgres
```

#### 2. Update Backend Connection
Modify `src/db/database.js` to use PostgreSQL instead of SQLite:
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

#### 3. Run Migrations
```bash
npm run migrate
npm run seed
```

## Domain & SSL Setup

### 1. Register Domain
- GoDaddy, Namecheap, AWS Route 53, etc.

### 2. Point to Server
- Update DNS A record to your server IP
- For Heroku: Use CNAME or custom domain

### 3. SSL Certificate
- **Heroku:** Automatic with *.herokuapp.com
- **Custom domain:** Let's Encrypt (free)

```bash
# Let's Encrypt setup
certbot certonly --standalone -d your-domain.com
```

### 4. Update Environment
```bash
# Backend
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Mobile app.json
"extra": {
  "apiBaseUrl": "https://api.your-domain.com/api"
}
```

## Monitoring & Logging

### Setup Monitoring

**Heroku**
```bash
heroku logs --tail
heroku metrics
```

**AWS CloudWatch**
```bash
# Enable detailed monitoring in EC2 console or CLI
```

**Self-hosted**
```bash
# Install monitoring
npm install -g pm2-monitoring
pm2 monitoring
```

### Health Checks

Add to monitoring:
```bash
curl -f https://your-domain.com/api/health || notify-alert
```

## Backups

### Database Backup

**Heroku PostgreSQL**
```bash
heroku pg:backups:capture
heroku pg:backups:download
```

**AWS RDS**
- Automatic daily snapshots
- Manual snapshots: AWS Console

**Self-hosted SQLite**
```bash
# Schedule daily backup
0 2 * * * cp /app/data/tata.db /backup/tata-$(date +\%Y\%m\%d).db
```

## Performance Optimization

### API Response Caching
```javascript
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
});
```

### CDN for Static Assets
- Deliver images/fonts from CloudFront or Cloudflare
- Reduces server load

### Database Indexing
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_weeks_number ON weeks(week_number);
```

## Security Checklist

- [ ] HTTPS/SSL enabled
- [ ] CORS whitelist set
- [ ] JWT secret is long and random
- [ ] No secrets in code/config files
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Error logging (not exposing internals)
- [ ] Regular security updates for Node.js/dependencies

## Rollback Procedure

### Heroku
```bash
heroku releases
heroku rollback v123  # Specify previous version
```

### AWS/Self-hosted
```bash
git revert <commit-hash>
git push heroku main
# or restart service with previous code
```

## Post-Deployment Testing

1. **API Health Check**
   ```bash
   curl https://api.your-domain.com/api/health
   ```

2. **User Registration**
   - Create test account
   - Verify JWT token works
   - Check user in database

3. **Data Endpoints**
   - GET all weeks
   - GET checkups
   - GET shopping list

4. **Error Handling**
   - Test invalid login
   - Test expired token
   - Test missing required fields

5. **Frontend Connection**
   - Update mobile `config/env.ts`
   - Register and login
   - Browse all content

## Debugging Production Issues

### View Logs
```bash
# Heroku
heroku logs --tail -n 100

# AWS EC2
tail -f /var/log/syslog
pm2 logs
```

### SSH Access
```bash
# AWS EC2
ssh -i key.pem ubuntu@instance-ip

# Check running processes
ps aux | grep node
pm2 list
```

### Database Issues
```bash
# Connect to production database
psql postgresql://user:pass@host:5432/dbname

# Verify schema
\dt  # List tables
\d users  # Describe table
```

## Rollback from Production

```bash
# Git history
git log --oneline

# Revert specific commit
git revert abc123...
git push heroku main

# Or reset (use carefully!)
git reset --hard abc123...
git push -f heroku main
```

## Cost Optimization

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Heroku | Hobby | Free (limited) |
| AWS EC2 | t3.micro | ~$10 |
| DigitalOcean | Basic | $5 |
| Vercel | Free | $0 |
| Let's Encrypt | Free | $0 |

## Maintenance Schedule

- **Daily:** Check logs, monitor errors
- **Weekly:** Database backups, dependency updates
- **Monthly:** Security patches, performance review
- **Quarterly:** Database maintenance, SSL renewal

---

**Questions?** Check [README.md](./README.md) or [SETUP.md](./SETUP.md) for more info.
