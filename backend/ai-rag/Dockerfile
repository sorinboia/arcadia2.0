FROM node:20

# Install Python and pip
RUN apt-get update && apt-get install -y net-tools python3 python3-pip python3-venv

# Set up a virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install ChromaDB in the virtual environment
RUN pip3 install chromadb==0.5.23

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

# Copy the ChromaDB startup script


# Create a startup script
RUN echo '#!/bin/sh\n\
chroma run --host 0.0.0.0 --port 8000 --path /chromaDb  &\n\
node index.js --aiRag=$AI_RAG --llmModel=$LLMMODEL --llmApiHost=$LLM --aiApiHost=$AI --db=$DB --webPort=$WEBPORT --usersApiHost=$USERSAPIHOST --loginApiHost=$LOGINAPIHOST --cashtApiHost=$CASHTAPIHOST --stocktApiHost=$STOCKTAPIHOST --stocksApiHost=$STOCKSAPIHOST --llmSecurityHost=$LLM_SECURITY_HOST --llmSecurityAppId=$LLM_SECURITY_APP_ID\n\
' > start.sh && chmod +x start.sh


CMD ["./start.sh"]