document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const chatForm = document.getElementById('chatForm');
    const uploadStatus = document.getElementById('uploadStatus');
    const chatResponse = document.getElementById('chatResponse');

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('fileInput');
        const files = fileInput.files;

        if (files.length === 0) {
            uploadStatus.innerHTML = '<p>Please select at least one file.</p>';
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            uploadStatus.innerHTML = '<p>Uploading files...</p>';
            const response = await fetch('/v1/ai-rag/uploadFiles', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                uploadStatus.innerHTML = `<p>${result.message}</p>`;
            } else {
                throw new Error('File upload failed');
            }
        } catch (error) {
            console.error('Error:', error);
            uploadStatus.innerHTML = '<p>An error occurred during file upload.</p>';
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const queryInput = document.getElementById('queryInput');
        const query = queryInput.value.trim();

        if (query === '') {
            return;
        }

        try {
            chatResponse.innerHTML = '<p>Processing your query...</p>';
            const response = await fetch('/v1/ai-rag/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });

            if (response.ok) {
                const result = await response.json();
                displayResponse(result);
            } else {
                throw new Error('Chat query failed');
            }
        } catch (error) {
            console.error('Error:', error);
            chatResponse.innerHTML = '<p>An error occurred while processing your query.</p>';
        }

        queryInput.value = '';
    });

    function displayResponse(data) {
        if (!Array.isArray(data) || data.length === 0 || !Array.isArray(data[0])) {
            chatResponse.innerHTML = '<p>No relevant information found.</p>';
            return;
        }

        const chunks = data[0];
        let htmlContent = '<div class="response-container">';
        htmlContent += '<h3>Relevant Information:</h3>';
        
        chunks.forEach((chunk, index) => {
            htmlContent += `
                <div class="response-chunk">
                    <h4>Source ${index + 1}</h4>
                    <p>${formatChunk(chunk)}</p>
                </div>
            `;
        });

        htmlContent += '</div>';
        chatResponse.innerHTML = htmlContent;
    }

    function formatChunk(chunk) {
        // Convert markdown-like syntax to HTML
        return chunk
            .replace(/^# (.*$)/gim, '<h2>$1</h2>')
            .replace(/^## (.*$)/gim, '<h3>$1</h3>')
            .replace(/^### (.*$)/gim, '<h4>$1</h4>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/- (.*)/g, '<li>$1</li>')
            .replace(/\n/g, '<br>');
    }
});