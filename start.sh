#!/bin/sh

# 等待 PostgreSQL 服务启动
echo "Waiting for PostgreSQL to start..."
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL is up!"

# 创建数据库（如果不存在）
echo "Creating database if not exists..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h db -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'openwebui_monitor'" | grep -q 1 || \
PGPASSWORD=$POSTGRES_PASSWORD psql -h db -U postgres -c "CREATE DATABASE openwebui_monitor"
echo "Database setup completed!"

# 等待新创建的数据库准备就绪
sleep 2

# 初始化数据库表
echo "Initializing database tables..."
pnpm db:push

# 启动应用
echo "Starting application..."
pnpm start 