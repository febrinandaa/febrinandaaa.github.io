#!/bin/bash
# Deploy script for Cloud Run Worker

PROJECT_ID="fb-auto-poster"
SERVICE_NAME="fb-poster-worker"
REGION="us-central1"
IMAGE="gcr.io/${PROJECT_ID}/worker"

echo "🔧 Building Docker image..."
gcloud builds submit --tag $IMAGE

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 256Mi \
  --timeout 60s \
  --max-instances 1

echo "✅ Deployment complete!"
echo ""
echo "🔗 Get your service URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
