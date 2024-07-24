#!/bin/sh
/bin/ollama serve &
echo "Sleep for 10"
sleep 10
echo "Done SLEEPING"
ollama run llama3

tail -f /dev/null