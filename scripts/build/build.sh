#!/usr/bin/env bash
TAG=ocp


(cd frontend/main && npm run build) && \
(docker build -t sorinboia/arcadia-frontend:$TAG frontend/main && docker push sorinboia/arcadia-frontend:$TAG) & \
(docker build -t sorinboia/arcadia-users:$TAG backend/users && docker push sorinboia/arcadia-users:$TAG) & \
(docker build -t sorinboia/arcadia-login:$TAG backend/login && docker push sorinboia/arcadia-login:$TAG) & \
(docker build -t sorinboia/arcadia-stock_transaction:$TAG backend/stock_transaction && docker push sorinboia/arcadia-stock_transaction:$TAG) & \
(docker build -t sorinboia/arcadia-stocks:$TAG backend/stocks && docker push sorinboia/arcadia-stocks:$TAG) & \
(docker build -t sorinboia/arcadia-db:$TAG backend/arcadia-db && docker push sorinboia/arcadia-db:$TAG)