<template>
  <div 
    class="ai-chatbot" 
    :class="{ 'ai-chatbot-open': isOpen }"
    :style="{ bottom: positionY + 'px', right: positionX + 'px' }"
    @mousedown="startDragging"
    @touchstart="startDragging"
  >
    <div class="ai-chatbot-header">
      <h3>AI Assistant</h3>
      <div class="ai-chatbot-controls">
        <button v-if="isOpen" @click.stop="handleRestartChat" class="restart-button" title="Restart Chat">
          <i class="fas fa-redo"></i>
        </button>
        <button class="ai-chatbot-toggle" @click.stop="toggleChat">{{ isOpen ? '−' : '+' }}</button>
      </div>
    </div>
    <div v-if="isOpen" class="ai-chatbot-body">
      <div class="ai-chatbot-messages" ref="messageContainer">
        <div v-for="(message, index) in conversation" :key="index" :class="['message', message.sender]">
          {{ message.text }}
        </div>
      </div>
      <div class="ai-chatbot-input">
        <input 
          v-model="userInput" 
          @keyup.enter="handleSendMessage" 
          placeholder="Type your message..." 
          :disabled="isWaiting"
        />
        <button @click="handleSendMessage" :disabled="isWaiting">
          {{ isWaiting ? 'Sending...' : 'Send' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'AIChatbot',
  data() {
    return {
      isOpen: false,
      userInput: '',
      isDragging: false,
      startX: 0,
      startY: 0,
      positionX: 20,
      positionY: 20,
      isWaiting: false
    }
  },
  computed: {
    ...mapState('aiChat', ['conversation'])
  },
  mounted() {
    window.addEventListener('mousemove', this.onDragging);
    window.addEventListener('mouseup', this.stopDragging);
    window.addEventListener('touchmove', this.onDragging);
    window.addEventListener('touchend', this.stopDragging);
    this.$nextTick(() => {
      this.initChat();
    });
  },
  beforeDestroy() {
    window.removeEventListener('mousemove', this.onDragging);
    window.removeEventListener('mouseup', this.stopDragging);
    window.removeEventListener('touchmove', this.onDragging);
    window.removeEventListener('touchend', this.stopDragging);
  },
  methods: {
    ...mapActions('aiChat', ['sendMessage', 'restartChat']),
    toggleChat(event) {
      event.stopPropagation();
      this.isOpen = !this.isOpen;
    },
    async handleSendMessage() {
      if (this.userInput.trim() === '' || this.isWaiting) return;
      
      this.isWaiting = true;
      try {
        await this.sendMessage(this.userInput);
        this.userInput = '';
      } catch (error) {
        console.error('Error in sending message:', error);
      } finally {
        this.isWaiting = false;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    handleRestartChat() {
      this.restartChat();
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    scrollToBottom() {
      const container = this.$refs.messageContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    startDragging(event) {
      if (event.target.closest('.ai-chatbot-header')) {
        this.isDragging = true;
        const chatbot = event.currentTarget;
        const rect = chatbot.getBoundingClientRect();
        
        if (event.type === 'mousedown') {
          this.startX = event.clientX - rect.left;
          this.startY = event.clientY - rect.top;
          document.body.style.userSelect = 'none'; // Prevent text selection
        } else if (event.type === 'touchstart') {
          this.startX = event.touches[0].clientX - rect.left;
          this.startY = event.touches[0].clientY - rect.top;
          document.body.style.userSelect = 'none'; // Prevent text selection
        }
      }
    },
    onDragging(event) {
      if (!this.isDragging) return;

      let clientX, clientY;
      if (event.type === 'mousemove') {
        clientX = event.clientX;
        clientY = event.clientY;
      } else if (event.type === 'touchmove') {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      }

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const chatbotWidth = this.$el.offsetWidth;
      const chatbotHeight = this.$el.offsetHeight;

      const newRight = windowWidth - (clientX - this.startX + chatbotWidth);
      const newBottom = windowHeight - (clientY - this.startY + chatbotHeight);

      this.positionX = Math.max(0, Math.min(newRight, windowWidth - chatbotWidth));
      this.positionY = Math.max(0, Math.min(newBottom, windowHeight - chatbotHeight));
    },
    stopDragging() {
      this.isDragging = false;
      document.body.style.userSelect = ''; // Re-enable text selection
    },
    initChat() {
      this.handleRestartChat();
    }
  }
}
</script>

<style scoped>
.ai-chatbot {
  position: fixed;
  width: 300px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  z-index: 1000;
  transition: all 0.3s ease;
  will-change: bottom, right; /* Optimize performance */
}

.ai-chatbot-open {
  height: 400px;
}

.ai-chatbot-header {
  background-color: #4CAF50;
  color: white;
  padding: 10px;
  cursor: move;
  border-radius: 10px 10px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  -webkit-user-drag: none; /* Prevent dragging on header */
  user-select: none; /* Prevent text selection on header */
}

.ai-chatbot-controls button {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  margin-left: 10px;
}

.ai-chatbot-body {
  height: calc(100% - 50px);
  display: flex;
  flex-direction: column;
}

.ai-chatbot-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
}

.message {
  margin-bottom: 10px;
  padding: 5px 10px;
  border-radius: 5px;
  max-width: 80%;
}

.user {
  background-color: #E3F2FD;
  align-self: flex-end;
  margin-left: auto;
}

.bot {
  background-color: #F1F3F4;
}

.ai-chatbot-input {
  display: flex;
  padding: 10px;
}

.ai-chatbot-input input {
  flex-grow: 1;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 5px 0 0 5px;
}

.ai-chatbot-input button {
  padding: 5px 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 0 5px 5px 0;
  cursor: pointer;
}

.ai-chatbot-input button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
