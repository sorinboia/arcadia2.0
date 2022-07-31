# sorinboiaf5/arcadia-bot

FROM node:14.17.0 AS baseimage

ENV TARGETURL https://arcadia.vltr.nginx-experience.com/


RUN apt-get update && apt-get install -yyq ca-certificates && \
 apt-get install -yyq libappindicator1 libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 && \
 apt-get install -yyq gconf-service lsb-release wget xdg-utils && \
 apt-get install -yyq fonts-liberation 


WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

FROM baseimage AS copycode
COPY . .

CMD ["sh","-c", "node index.js --url=$TARGETURL"]