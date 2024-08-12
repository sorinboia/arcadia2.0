FROM node:20

# Create app directory
WORKDIR /usr/src/app

ENV WEBPORT 80
ENV USERSAPIHOST arcadia-users
ENV LOGINAPIHOST arcadia-login
ENV CASHTAPIHOST arcadia-cash-transfer
ENV STOCKTAPIHOST arcadia-stock-transfer
ENV STOCKSAPIHOST arcadia-stocks
ENV DB arcadia-db
ENV AI arcadia-ai
ENV LLM arcadia-llm
ENV LLMMODEL llama3.1:8b
ENV LLM_SECURITY_HOST bypass
ENV LLM_SECURITY_APP_ID your_app_id_here
ENV AI_RAG arcadia-ai-rag

# Install app dependencies
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 80
CMD ["sh","-c", "node index.js --aiRag=$AI_RAG --llmModel=$LLMMODEL --llmApiHost=$LLM --aiApiHost=$AI --db=$DB --webPort=$WEBPORT --usersApiHost=$USERSAPIHOST --loginApiHost=$LOGINAPIHOST --cashtApiHost=$CASHTAPIHOST --stocktApiHost=$STOCKTAPIHOST --stocksApiHost=$STOCKSAPIHOST --llmSecurityHost=$LLM_SECURITY_HOST --llmSecurityAppId=$LLM_SECURITY_APP_ID"]