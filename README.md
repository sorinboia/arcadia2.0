# Arcadia Crypto

Arcadia Crypto is an application developed for demonstrating different scenarios in a microservices environment.


### High level architecture
Arcadia crypto is composed of 6 different services.  

Frontend -  Contains the frontend application developed in Vue. It runs as a SPA application which renders data based on API calls.  
DB - Mongo DB used to store user and transactions information.  
Login - Deals with the login process and it is the authoritative services which decides if the provided credentials are valid.  
Users - Deals with any process which requires user generic information like available amount of money, crypto stock balance.  
Stock Transaction - It is called when a user wants to buy/sell crypto and decides if the transaction is valid ( checks user balance and crypto value ). It also records the transactions in the DB.  
Stocks - Connects to external Crypto provider in order to get crypto currency price.



