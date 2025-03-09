#!/bin/bash
# Database backup script for Local Services Directory application

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./database_backups"
BACKUP_FILENAME="local_services_backup_${TIMESTAMP}.sql"
S3_BUCKET="${AWS_S3_BUCKET:-local-services-backups}"
RETENTION_DAYS=14

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Extract database connection details from DATABASE_URL
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "Error: Could not parse DATABASE_URL"
  exit 1
fi

echo "Starting database backup for $DB_NAME on $DB_HOST"

# Set PGPASSWORD environment variable for passwordless connection
export PGPASSWORD="$DB_PASS"

# Create the backup
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -b -v -f "$BACKUP_DIR/$BACKUP_FILENAME"
BACKUP_RESULT=$?

# Check if backup was successful
if [ $BACKUP_RESULT -ne 0 ]; then
  echo "Error: Database backup failed with exit code $BACKUP_RESULT"
  exit $BACKUP_RESULT
fi

echo "Backup created successfully: $BACKUP_DIR/$BACKUP_FILENAME"

# Compress the backup
gzip "$BACKUP_DIR/$BACKUP_FILENAME"
COMPRESSED_FILENAME="$BACKUP_FILENAME.gz"

echo "Backup compressed: $BACKUP_DIR/$COMPRESSED_FILENAME"

# Upload to S3 if AWS credentials are configured
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Uploading backup to S3 bucket: $S3_BUCKET"
  aws s3 cp "$BACKUP_DIR/$COMPRESSED_FILENAME" "s3://$S3_BUCKET/$COMPRESSED_FILENAME"
  
  if [ $? -eq 0 ]; then
    echo "Backup uploaded to S3 successfully"
  else
    echo "Warning: Failed to upload backup to S3"
  fi
else
  echo "AWS credentials not found. Skipping S3 upload."
fi

# Clean up old backups (locally)
echo "Cleaning up backups older than $RETENTION_DAYS days"
find $BACKUP_DIR -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete

# If using S3, also clean up old backups there
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Cleaning up old backups from S3"
  # List objects older than retention period and delete them
  aws s3api list-objects-v2 --bucket $S3_BUCKET --query "Contents[?LastModified<='$(date -d "-$RETENTION_DAYS days" --iso-8601)'].[Key]" --output text | xargs -I {} aws s3 rm s3://$S3_BUCKET/{}
fi

echo "Backup process completed"