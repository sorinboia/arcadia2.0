#!/usr/bin/env bash

pwd

(docker build --no-cache -t sorinboia/arcadia-users:v0.1 backend/users && docker push sorinboia/arcadia-users:v0.1) & \
(docker build --no-cache -t sorinboia/arcadia-login:v0.1 backend/login && docker push sorinboia/arcadia-login:v0.1) & \
(docker build --no-cache -t sorinboia/arcadia-stock_transaction:v0.1 backend/stock_transaction && docker push sorinboia/stock_transaction:v0.1) & \
(docker build --no-cache -t sorinboia/arcadia-stocks:v0.1 backend/stocks && docker push sorinboia/stocks:v0.1)
