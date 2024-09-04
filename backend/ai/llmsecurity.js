const axios = require('axios');

class LLMSecurity {
    constructor({hostname, appId}) {
        this.hostname = hostname;
        this.appId = appId;
    }

    async protect({prompt="", systemPrompt="", response="", user=""}) {
        try {
            const result = await axios.post(`https://${this.hostname}/api/protect`, {
                prompt,
                system_prompt: systemPrompt,
                response,
                user
            }, {
                headers: {
                    'APP-ID': this.appId,
                    'Content-Type': 'application/json'
                }
            });

            let passed = true; 
            
            passed = result.data.result.prompt != null ? (passed = result.data.result.prompt.passed) : passed;
            passed = result.data.result.response != null ? (passed = result.data.result.response.passed) : passed;
                                       
            return { passed, result: result.data };
        } catch (error) {
            console.error('Error calling LLM security device:', error);
            throw error;
        }
    }
}

module.exports = LLMSecurity;