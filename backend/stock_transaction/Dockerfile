FROM node:12

# Create app directory
WORKDIR /usr/src/app


ENV WEBPORT 80
ENV USERSAPIHOST arcadia-users
ENV LOGINAPIHOST arcadia-login
ENV CASHTAPIHOST arcadia-cash-transfer
ENV STOCKTAPIHOST arcadia-stock-transfer
ENV STOCKSAPIHOST arcadia-stocks
ENV DB arcadia-db


# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install
COPY . .
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 80
CMD ["sh","-c", "node index.js --db=$DB --webPort=$WEBPORT --usersApiHost=$USERSAPIHOST --loginApiHost=$LOGINAPIHOST --cashtApiHost=$CASHTAPIHOST --stocktApiHost=$STOCKTAPIHOST --stocksApiHost=$STOCKSAPIHOST"]