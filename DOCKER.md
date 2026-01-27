# FliphatsPro Docker Setup

Quick guide to run FliphatsPro with Docker.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- Git (to clone the repo)

## Quick Start (Development)

```bash
# 1. Start all services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 2. View logs
docker-compose logs -f app

# 3. Access the app
# App: http://localhost:3000
# phpMyAdmin: http://localhost:8080
```

## Quick Start (Production)

```bash
# 1. Copy and edit environment file
cp .env.docker.example .env

# 2. Build and start
docker-compose up -d --build

# 3. Run migrations
docker-compose exec mysql mysql -uroot -prootpassword fliphatspro < migrations/multi-tenant/001_create_tenant_tables.sql
```

## Services

| Service | URL | Credentials |
|---------|-----|-------------|
| App | http://localhost:3000 | — |
| phpMyAdmin | http://localhost:8080 | root / rootpassword |
| MySQL | localhost:3306 | flipuser / flippass123 |
| Redis | localhost:6379 | — |

## Common Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild app after code changes
docker-compose up -d --build app

# Run migrations
docker-compose exec mysql mysql -uroot -prootpassword fliphatspro < migrations/multi-tenant/001_create_tenant_tables.sql
docker-compose exec mysql mysql -uroot -prootpassword fliphatspro < migrations/multi-tenant/002_add_tenant_id_columns.sql
docker-compose exec mysql mysql -uroot -prootpassword fliphatspro < migrations/multi-tenant/003_migrate_existing_data.sql

# Access MySQL shell
docker-compose exec mysql mysql -uroot -prootpassword fliphatspro

# View app logs
docker-compose logs -f app

# Regenerate Prisma client
docker-compose exec app npx prisma generate
```

## Migrating from XAMPP

1. Export your XAMPP database:
   ```bash
   mysqldump -u root dbfliphats > backup.sql
   ```

2. Start Docker services:
   ```bash
   docker-compose up -d mysql
   ```

3. Import the backup:
   ```bash
   docker-compose exec -T mysql mysql -uroot -prootpassword fliphatspro < backup.sql
   ```

4. Run multi-tenant migrations:
   ```bash
   docker-compose exec mysql mysql -uroot -prootpassword fliphatspro < migrations/multi-tenant/001_create_tenant_tables.sql
   ```

## Production Deployment

For VPS/Cloud deployment, use the production compose file:

```bash
# Build production image
docker build -t fliphatspro:latest .

# Or use docker-compose
docker-compose -f docker-compose.yml up -d --build
```

## Troubleshooting

### MySQL connection refused
Wait for MySQL to fully start (check with `docker-compose logs mysql`)

### Port already in use
Stop XAMPP/other services using ports 3306, 3000, 6379, or 8080

### Permission issues on Windows
Run Docker Desktop as administrator
