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
  async sendMessage({ commit }, newMessage) {
    commit('ADD_MESSAGE', { sender: 'user', text: newMessage });    
    try {          
      const response = await user.aiChat({ newQuestion: newMessage });
      
      const botReply = { sender: 'bot', text: response.reply };
      commit('ADD_MESSAGE', botReply);
      return botReply;
    } catch (error) {
      console.error('Error sending message to AI:', error);
      const errorMessage = { sender: 'bot', text: 'Sorry, I encountered an error. Please try again.' };
      commit('ADD_MESSAGE', errorMessage);
      throw error;
    }
  },
  async regenerateLastResponse({ commit, state }) {
    if (state.conversation.length < 2) return;

    commit('REMOVE_LAST_BOT_MESSAGE');
    const lastUserMessage = state.conversation[state.conversation.length - 1].text;

    try {
      const response = await user.regenerateLastResponse();
      if (response.status === 'success') {
        const botReply = { sender: 'bot', text: response.reply };
        commit('ADD_MESSAGE', botReply);
        return botReply;
      }
    } catch (error) {
      console.error('Error regenerating response:', error);
      const errorMessage = { sender: 'bot', text: 'Sorry, I encountered an error while regenerating the response. Please try again.' };
      commit('ADD_MESSAGE', errorMessage);
      throw error;
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
