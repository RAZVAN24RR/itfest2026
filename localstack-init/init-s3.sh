#!/bin/bash
echo "Creating S3 buckets..."

awslocal s3 mb s3://campaia-dev-media --region eu-central-1 2>/dev/null || true
awslocal s3 mb s3://campaia-dev-invoices --region eu-central-1 2>/dev/null || true

awslocal s3api put-bucket-cors --bucket campaia-dev-media --region eu-central-1 --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }]
}' 2>/dev/null || true

echo "S3 buckets ready."
