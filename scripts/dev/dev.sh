#!/usr/bin/env bash


usersHost="localhost:3001"
loginHost="localhost:3002"
cashtHost="localhost:3003"
stocksHost="localhost:3004"
stocktHost="localhost:3005"
aiHost="localhost:3006"
aiRag="localhost:3007"
llmHost="192.168.0.101:11434"
#llmHost="localhost:4141"

db="localhost"
llmSecurityHost="bypass"
llmSecurityHost="prompt-security.workshop.emea.f5se.com"
llmSecurityAppId="f4977782-d3ce-4530-bc66-8801d9c377bc"
#llmModel="llama3.1:8b"
llmModel="llama3.2:3b"
#llmModel="MFDoom/deepseek-r1-tool-calling:8b"

#llmModel="granite3-dense:8b"

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