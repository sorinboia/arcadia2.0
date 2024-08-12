#!/usr/bin/env bash
TAG=v1
REPO=sorinboiaf5

(cd frontend/main && npm run build) && \
(docker build -t $REPO/arcadia-frontend:$TAG frontend/main && docker push $REPO/arcadia-frontend:$TAG) & \
(docker build -t $REPO/arcadia-users:$TAG backend/users && docker push $REPO/arcadia-users:$TAG) & \
(docker build -t $REPO/arcadia-login:$TAG backend/login && docker push $REPO/arcadia-login:$TAG) & \
(docker build -t $REPO/arcadia-stock_transaction:$TAG backend/stock_transaction && docker push $REPO/arcadia-stock_transaction:$TAG) & \
(docker build -t $REPO/arcadia-stocks:$TAG backend/stocks && docker push $REPO/arcadia-stocks:$TAG) & \
(docker build -t $REPO/arcadia-db:$TAG backend/arcadia-db && docker push $REPO/arcadia-db:$TAG)
(docker build -t $REPO/arcadia-ai:$TAG backend/ai && docker push $REPO/arcadia-ai:$TAG)
(docker build -t $REPO/arcadia-ai-rag:$TAG backend/ai-rag && docker push $REPO/arcadia-ai-rag:$TAG)