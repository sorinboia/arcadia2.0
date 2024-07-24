FROM ollama/ollama:latest

WORKDIR /app

# Copy the entrypoint script into the container
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

RUN ./start.sh

#CMD ["sh", "-c", "sleep 10 && ollama exec run llama3:8b"]
COPY delayed_start.sh /app/delayed_start.sh
RUN chmod +x delayed_start.sh
ENTRYPOINT ["/app/delayed_start.sh"]


#CMD ["run", "llama3:8b"]



