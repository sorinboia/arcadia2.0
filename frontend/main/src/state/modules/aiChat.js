// state/modules/aiChat.js

import user from '@/api/user';

console.log('aiChat module loaded!');

const state = {
  conversation: []
};

const mutations = {
  ADD_MESSAGE(state, message) {
    state.conversation.push(message);
  },
  REMOVE_LAST_BOT_MESSAGE(state) {
    const lastBotMessageIndex = state.conversation.slice().reverse().findIndex(msg => msg.sender === 'bot');
    if (lastBotMessageIndex !== -1) {
      state.conversation.splice(state.conversation.length - 1 - lastBotMessageIndex, 1);
    }
  },
  CLEAR_CONVERSATION(state) {
    state.conversation = [];
  }
};

const actions = {
  // Update signature to accept { newMessage, useTools }
  async sendMessage({ commit }, { newMessage, useTools }) {
    commit('ADD_MESSAGE', { sender: 'user', text: newMessage });
    try {
      const requestId = await user.startAiChatAsync({ newMessage, useTools });
      let status, reply;
      do {
        await new Promise(res => setTimeout(res, 1000));
        const result = await user.getAiChatStatus(requestId);
        status = result.status;
        reply = result.reply;
      } while (status === 'processing');
      if (status === 'completed') {
        const botReply = { sender: 'bot', text: reply };
        commit('ADD_MESSAGE', botReply);
        return botReply;
      } else {
        const errorMessage = { sender: 'bot', text: 'Sorry, I encountered an error processing your request.' };
        commit('ADD_MESSAGE', errorMessage);
        throw new Error('AI chat error status');
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      const errorMessage = { sender: 'bot', text: 'Sorry, I encountered an error. Please try again.' };
      commit('ADD_MESSAGE', errorMessage);
      throw error;
    }
  },
  // Update signature to accept { useTools }
  async regenerateLastResponse({ commit, state }, { useTools }) {
    if (state.conversation.length < 2) return;

    commit('REMOVE_LAST_BOT_MESSAGE');
    // No need to get last user message text here, backend handles it

    try {
      // Pass useTools to the API call
      const response = await user.regenerateLastResponse({ useTools });
      if (response.status === 'success') {
        const botReply = { sender: 'bot', text: response.reply };
        commit('ADD_MESSAGE', botReply);
        return botReply;
      } else {
         // Handle potential errors from regeneration reported by the backend
         console.error('Error regenerating response:', response.message || 'Unknown error');
         commit('ADD_MESSAGE', { sender: 'bot', text: `Sorry, I couldn't regenerate the response. ${response.message || ''}` });
      }
    } catch (error) {
      console.error('Error regenerating last response:', error);
      commit('ADD_MESSAGE', { sender: 'bot', text: 'Sorry, I encountered an error while regenerating.' });
      throw error; // Re-throw if needed elsewhere
    }
  },
  async restartChat({ commit }) {
    commit('CLEAR_CONVERSATION');
    const initialMessage = { sender: 'bot', text: 'Hello! How can I assist you with crypto trading today?' };
    commit('ADD_MESSAGE', initialMessage);
  }
};

const getters = {
  // You can add getters here if needed
};

export  {  
  state,
  mutations,
  actions,
  getters
};
