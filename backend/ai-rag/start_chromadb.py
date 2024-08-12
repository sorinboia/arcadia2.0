from chromadb.server import Server

def start_chromadb():
    # Initialize the ChromaDB server
    server = Server()
    
    # Start the server on port 8000
    server.run(host="0.0.0.0", port=8000)

if __name__ == "__main__":
    start_chromadb()
