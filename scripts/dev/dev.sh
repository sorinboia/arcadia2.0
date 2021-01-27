#!/usr/bin/env bash


usersHost="localhost:3001"
loginHost="localhost:3002"
cashtHost="localhost:3003"
stocksHost="localhost:3004"
stocktHost="localhost:3005"
db="this_is_not_actually_used"

nginx_config="$PWD/scripts/dev/nginx/conf.d"

args_command="--db=$db --usersApiHost=$usersHost --loginApiHost=$loginHost --cashtApiHost=$cashtsHost --stocktApiHost=$stocktHost --stocksApiHost=$stocksHost"



(cd frontend/main && npm run serve) & \
nodemon backend/users/index.js --webPort=3001  $args_command & \
nodemon backend/login/index.js --webPort=3002  $args_command & \
nodemon backend/cash_transfer/index.js --webPort=3003  $args_command & \
nodemon backend/stocks/index.js --webPort=3004  $args_command & \
nodemon backend/stock_transaction/index.js --webPort=3005  $args_command


