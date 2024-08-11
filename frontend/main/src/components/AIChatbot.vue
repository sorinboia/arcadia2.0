<template>
  <div>
    <div 
      v-if="isChatbotAvailable"
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
            :placeholder="isWaiting ? waitingMessages[currentWaitingMessageIndex] : 'Type your message...'" 
            :disabled="isWaiting"
            :readonly="isWaiting"
          />
          <button @click="handleSendMessage" :disabled="isWaiting">
            {{ isWaiting ? `${responseTime}s` : 'Send' }}
          </button>
        </div>
      </div>
      <audio ref="audioAlert" src="@/assets/sounds/notification.wav"></audio>
    </div>
    <div v-if="highlightResponse" class="full-page-highlight"></div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import user from '@/api/user';

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
      isWaiting: false,
      isChatbotAvailable: false,
      waitingMessages: ['Thinking...', 'AI at work...', 'Making Magic...', 'Abracadabra...', 'Processing...'],
      currentWaitingMessageIndex: 0,
      waitingMessageInterval: null,
      highlightResponse: false,
      responseTime: 0,
      responseTimeInterval: null
    }
  },
  computed: {
    ...mapState('aiChat', ['conversation'])
  },
  mounted() {
    this.checkChatbotAvailability();
    window.addEventListener('mousemove', this.onDragging);
    window.addEventListener('mouseup', this.stopDragging);
    window.addEventListener('touchmove', this.onDragging);
    window.addEventListener('touchend', this.stopDragging);
  },
  beforeDestroy() {
    window.removeEventListener('mousemove', this.onDragging);
    window.removeEventListener('mouseup', this.stopDragging);
    window.removeEventListener('touchmove', this.onDragging);
    window.removeEventListener('touchend', this.stopDragging);
    this.clearWaitingMessageInterval();
    this.clearResponseTimeInterval();
  },
  methods: {
    ...mapActions('aiChat', ['sendMessage', 'restartChat']),
    checkChatbotAvailability() {
      this.isChatbotAvailable = user.loggedIn;
      if (this.isChatbotAvailable) {
        this.$nextTick(() => {
          this.initChat();
        });
      } else {
        console.log('AI Chatbot is not available. User not logged in.');
      }
    },
    toggleChat(event) {
      event.stopPropagation();
      this.isOpen = !this.isOpen;
    },
    async handleSendMessage() {
      if (this.userInput.trim() === '' || this.isWaiting) return;
      
      const sentMessage = this.userInput;
      this.isWaiting = true;
      this.startWaitingMessageRotation();
      this.startResponseTimeCounter();
      this.userInput = this.waitingMessages[0]; // Set initial waiting message
      
      try {
        await this.sendMessage(sentMessage);
        this.highlightResponseReceived();
      } catch (error) {
        console.error('Error in sending message:', error);
      } finally {
        this.isWaiting = false;
        this.userInput = '';
        this.clearWaitingMessageInterval();
        this.clearResponseTimeInterval();
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    startWaitingMessageRotation() {
      this.currentWaitingMessageIndex = 0;
      this.waitingMessageInterval = setInterval(() => {
        this.currentWaitingMessageIndex = (this.currentWaitingMessageIndex + 1) % this.waitingMessages.length;
        this.userInput = this.waitingMessages[this.currentWaitingMessageIndex];
      }, 1000);
    },
    clearWaitingMessageInterval() {
      if (this.waitingMessageInterval) {
        clearInterval(this.waitingMessageInterval);
        this.waitingMessageInterval = null;
      }
    },
    startResponseTimeCounter() {
      this.responseTime = 0;
      this.responseTimeInterval = setInterval(() => {
        this.responseTime++;
      }, 1000);
    },
    clearResponseTimeInterval() {
      if (this.responseTimeInterval) {
        clearInterval(this.responseTimeInterval);
        this.responseTimeInterval = null;
      }
    },
    highlightResponseReceived() {
      this.highlightResponse = true;
      this.$refs.audioAlert.play();
      
      setTimeout(() => {
        this.highlightResponse = false;
      }, 1000);
    },
    async handleRestartChat() {
      try {
        await user.resetAiChat();
        await this.restartChat();
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } catch (error) {
        console.error('Error resetting chat:', error);
      }
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
        const chatbot = this.$el.querySelector('.ai-chatbot');
        const rect = chatbot.getBoundingClientRect();
        
        if (event.type === 'mousedown') {
          this.startX = event.clientX - rect.left;
          this.startY = event.clientY - rect.top;
        } else if (event.type === 'touchstart') {
          this.startX = event.touches[0].clientX - rect.left;
          this.startY = event.touches[0].clientY - rect.top;
        }
        document.body.style.userSelect = 'none';
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
      const chatbot = this.$el.querySelector('.ai-chatbot');
      const chatbotWidth = chatbot.offsetWidth;
      const chatbotHeight = chatbot.offsetHeight;

      const newRight = windowWidth - clientX + this.startX - chatbotWidth;
      const newBottom = windowHeight - clientY + this.startY - chatbotHeight;

      this.positionX = Math.max(0, Math.min(newRight, windowWidth - chatbotWidth));
      this.positionY = Math.max(0, Math.min(newBottom, windowHeight - chatbotHeight));
    },
    stopDragging() {
      this.isDragging = false;
      document.body.style.userSelect = '';
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
  will-change: bottom, right;
}

.ai-chatbot-open {
  height: 400px;
}

.full-page-highlight {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(76, 175, 80, 0.3);
  z-index: 9999;
  animation: fullPageHighlight 1s ease-in-out;
}

@keyframes fullPageHighlight {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
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
  -webkit-user-drag: none;
  user-select: none;
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
  min-width: 60px;
}

.ai-chatbot-input button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>