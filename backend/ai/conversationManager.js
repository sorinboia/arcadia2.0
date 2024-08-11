// conversationManager.js

class ConversationManager {
    constructor({ systemPrompt }) {
        this.systemPrompt = systemPrompt;
        this.conversations = new Map();
    }

    getConversation(accountId) {
        if (!this.conversations.has(accountId)) {
            this.conversations.set(accountId, []);
        }
        return this.conversations.get(accountId);
    }

    addMessage(accountId, message) {
        const conversation = this.getConversation(accountId);
        if (conversation.length === 0) conversation.push({role:'system', content: this.systemPrompt})
        conversation.push(message);
    }

    resetConversation(accountId) {
        this.conversations.set(accountId, []);
    }

    getAllConversations() {
        return Object.fromEntries(this.conversations);
    }
}

module.exports = ConversationManager;