#!/usr/bin/env bash

(cd frontend/main && npm run build) && \
(docker build -t sorinboia/arcadia-frontend:solday frontend/main && docker push sorinboia/arcadia-frontend:solday) & \
(docker build -t sorinboia/arcadia-users:solday backend/users && docker push sorinboia/arcadia-users:solday) & \
(docker build -t sorinboia/arcadia-login:solday backend/login && docker push sorinboia/arcadia-login:solday) & \
(docker build -t sorinboia/arcadia-stock_transaction:solday backend/stock_transaction && docker push sorinboia/arcadia-stock_transaction:solday) & \
(docker build -t sorinboia/arcadia-stocks:solday backend/stocks && docker push sorinboia/arcadia-stocks:solday) & \
(docker build -t sorinboia/arcadia-db:solday backend/arcadia-db && docker push sorinboia/arcadia-db:solday)