// state/modules/aiChat.js

import user from '@/api/user';

console.log('THIS IS loaded');

const state = {
  conversation: []
};

const mutations = {
  ADD_MESSAGE(state, message) {
    state.conversation.push(message);
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
  async restartChat({ commit }) {
    commit('CLEAR_CONVERSATION');
    const initialMessage = { sender: 'bot', text: 'Hello! How can I assist you with crypto trading today?' };
    commit('ADD_MESSAGE', initialMessage);
  }
};

const getters = {
  // You can add getters here if needed
};

export {
  state,
  mutations,
  actions,
  getters
};