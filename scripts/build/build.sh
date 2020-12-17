#!/usr/bin/env bash

(cd frontend/main && npm run build) && \
(docker build -t sorinboia/arcadia-frontend:v0.1 frontend/main && docker push sorinboia/arcadia-frontend:v0.1) & \
(docker build -t sorinboia/arcadia-users:v0.1 backend/users && docker push sorinboia/arcadia-users:v0.1) & \
(docker build -t sorinboia/arcadia-login:v0.1 backend/login && docker push sorinboia/arcadia-login:v0.1) & \
(docker build -t sorinboia/arcadia-stock_transaction:v0.1 backend/stock_transaction && docker push sorinboia/arcadia-stock_transaction:v0.1) & \
(docker build -t sorinboia/arcadia-stocks:v0.1 backend/stocks && docker push sorinboia/arcadia-stocks:v0.1) & \
(docker build -t sorinboia/arcadia-db:v0.1 backend/arcadia-db && docker push sorinboia/arcadia-db:v0.1)