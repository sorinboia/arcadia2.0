#!/usr/bin/env bash


usersHost="localhost:3001"
loginHost="localhost:3002"
cashtHost="localhost:3003"
stocksHost="localhost:3004"
stocktHost="localhost:3005"
aiHost="localhost:3006"
llmHost="localhost:11434"
db="localhost"

args_command="--db=$db --llmApiHost=$llmHost --aiApiHost=$aiHost --usersApiHost=$usersHost --loginApiHost=$loginHost --cashtApiHost=$cashtsHost --stocktApiHost=$stocktHost --stocksApiHost=$stocksHost"



(cd frontend/main && npm run serve) & \
node backend/users/index.js --webPort=3001  $args_command & \
node backend/login/index.js --webPort=3002  $args_command & \
#node backend/cash_transfer/index.js --webPort=3003  $args_command & \
node backend/stocks/index.js --webPort=3004  $args_command & \
node backend/stock_transaction/index.js --webPort=3005  $args_command & \
node backend/ai/index.js --webPort=3006  $args_command & \
node scripts/dev/dev_proxy/index.js