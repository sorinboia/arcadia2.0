#!/usr/bin/env bash


usersHost="localhost:3001"
loginHost="localhost:3002"
cashtHost="localhost:3003"
stocksHost="localhost:3004"
stocktHost="localhost:3005"
aiHost="localhost:3006"
aiRag="localhost:3007"
llmHost="192.168.0.101:11434"
db="localhost"
llmSecurityHost="bypass"
#llmSecurityHost="prompt-security.workshop.emea.f5se.com"
llmSecurityAppId="435a5b61-7cc3-41a9-b239-4758a684bd73"
llmModel="llama3.1:8B"

args_command="--aiRag=$aiRag --db=$db --llmModel=$llmModel --llmSecurityHost=$llmSecurityHost --llmSecurityAppId=$llmSecurityAppId --llmApiHost=$llmHost --aiApiHost=$aiHost --usersApiHost=$usersHost --loginApiHost=$loginHost --cashtApiHost=$cashtsHost --stocktApiHost=$stocktHost --stocksApiHost=$stocksHost"



(cd frontend/main && npm run serve) & \
nodemon backend/users/index.js --webPort=3001  $args_command & \
nodemon backend/login/index.js --webPort=3002  $args_command & \
#node backend/cash_transfer/index.js --webPort=3003  $args_command & \
nodemon backend/stocks/index.js --webPort=3004  $args_command & \
nodemon backend/stock_transaction/index.js --webPort=3005  $args_command & \
nodemon backend/ai/index.js --webPort=3006  $args_command & \
nodemon backend/ai-rag/index.js --webPort=3007  $args_command & \
node scripts/dev/dev_proxy/index.js