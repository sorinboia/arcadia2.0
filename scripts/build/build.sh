#!/usr/bin/env bash

(cd frontend/main && npm run build) && \
(docker build -t sorinboia/arcadia-frontend:oktav0.1 frontend/main && docker push sorinboia/arcadia-frontend:oktav0.1) & \
(docker build -t sorinboia/arcadia-users:oktav0.1 backend/users && docker push sorinboia/arcadia-users:oktav0.1) & \
(docker build -t sorinboia/arcadia-login:oktav0.1 backend/login && docker push sorinboia/arcadia-login:oktav0.1) & \
(docker build -t sorinboia/arcadia-stock_transaction:oktav0.1 backend/stock_transaction && docker push sorinboia/arcadia-stock_transaction:oktav0.1) & \
(docker build -t sorinboia/arcadia-stocks:oktav0.1 backend/stocks && docker push sorinboia/arcadia-stocks:oktav0.1) & \
(docker build -t sorinboia/arcadia-db:oktav0.1 backend/arcadia-db && docker push sorinboia/arcadia-db:oktav0.1)