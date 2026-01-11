#!/bin/bash
# Setup Cloud Scheduler

PROJECT_ID="fb-auto-poster"
LOCATION="us-central1"
JOB_NAME="fb-poster-trigger"

# Get Cloud Run URL
WORKER_URL=$(gcloud run services describe fb-poster-worker --region $LOCATION --format 'value(status.url)')

echo "🕐 Creating Cloud Scheduler job..."
gcloud scheduler jobs create http $JOB_NAME \
  --project=$PROJECT_ID \
  --location=$LOCATION \
  --schedule="*/6 5-21 * * *" \
  --time-zone="Asia/Jakarta" \
  --uri="${WORKER_URL}/trigger" \
  --http-method=POST \
  --headers="Content-Type=application/json"

echo "✅ Scheduler created!"
echo ""
echo "📋 Job details:"
gcloud scheduler jobs describe $JOB_NAME --location=$LOCATION
