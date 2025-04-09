<template>
  <div>
    <div 
      v-if="isChatbotAvailable"
      class="ai-chatbot" 
      :class="{ 'ai-chatbot-open': isOpen }"
      :style="{ 
        top: chatTop + 'px', 
        left: chatLeft + 'px', 
        width: chatWidth + 'px', 
        height: isOpen ? chatHeight + 'px' : 'auto' 
      }"
    >
      <div class="ai-chatbot-header" @mousedown="startDragging" @touchstart="startDragging">
        <h3>AI Assistant</h3>
        <div class="ai-chatbot-controls">
          <button v-if="isOpen" @click.stop="handleRestartChat" class="restart-button" title="Restart Chat">
            <i class="fas fa-redo"></i>
          </button>
          <button class="ai-chatbot-toggle" @click.stop="toggleChat">{{ isOpen ? '−' : '+' }}</button>
        </div>
      </div>
      </div>
      <!-- Add this block below the header -->
      <div v-if="isOpen" class="ai-chatbot-options">
        <label>
          <input type="checkbox" v-model="useTools"> Use Tools
        </label>
      </div>
      <!-- End of added block -->
      <div v-if="isOpen" class="ai-chatbot-body">
        <div class="ai-chatbot-messages" ref="messageContainer">
          <div v-for="(message, index) in conversation" :key="index" :class="['message', message.sender]">
            <template v-if="message.sender === 'user'">
              {{ message.text }}
            </template>
            <div v-else class="bot-message">
              <vue-markdown class="markdown-body">{{ message.text }}</vue-markdown>
              <button 
                v-if="index === conversation.length - 1 && message.sender === 'bot' && index > 0" 
                @click="handleRegenerateLastResponse" 
                class="regenerate-button" 
                title="Regenerate response"
              >
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>
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
      <div 
        v-if="isOpen" 
        class="resize-handle" 
        :class="{ 'resizing': isResizing }"
        @mousedown="startResizing" 
        @touchstart="startResizing"
      ></div>
    <audio ref="notificationSound" preload="auto">
      <source src="@/assets/sounds/notification.wav" type="audio/mpeg">
    </audio>
    </div>
  </div>
</template>




<script>
import { mapState, mapActions } from 'vuex';
import user from '@/api/user';
import VueMarkdown from 'vue-markdown';

export default {
  name: 'AIChatbot',
  components: {
    VueMarkdown
  },
  data() {
    return {
      isOpen: false,
      userInput: '',
      isDragging: false,
      isResizing: false,
      chatTop: window.innerHeight - 420,
      chatLeft: window.innerWidth - 320,
      chatWidth: 300,
      chatHeight: 400,
      startX: 0,
      startY: 0,
      startTop: 0,
      startLeft: 0,
      startWidth: 0,
      startHeight: 0,
      isWaiting: false,
      isChatbotAvailable: false,
      waitingMessages: ['Thinking...', 'AI at work...', 'Making Magic...', 'Abracadabra...', 'Processing...'],
      currentWaitingMessageIndex: 0,
      waitingMessageInterval: null,
      responseTime: 0,
      responseTimeInterval: null,
      useTools: false
    }
  },
  computed: {
    ...mapState('aiChat', ['conversation'])
  },
  mounted() {
    this.checkChatbotAvailability();
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('touchmove', this.onTouchMove);
    document.addEventListener('touchend', this.onTouchEnd);
  },
  beforeDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  },
  methods: {
    ...mapActions('aiChat', ['sendMessage', 'restartChat', 'regenerateLastResponse']),
    async handleRegenerateLastResponse() {
      if (this.conversation.length < 2 || this.isWaiting) return;

      this.setWaitingState();

      try {
        // Pass useTools in the payload object
        await this.$store.dispatch('aiChat/regenerateLastResponse', { useTools: this.useTools });
        this.playNotificationSound();
      } catch (error) {
        console.error('Error regenerating response:', error);
      } finally {
        this.clearWaitingState();
      }
    },

    setWaitingState() {
      this.isWaiting = true;
      this.startWaitingMessageRotation();
      this.startResponseTimeCounter();
      this.userInput = this.waitingMessages[0];
    },

    clearWaitingState() {
      this.isWaiting = false;
      this.userInput = '';
      this.clearWaitingMessageInterval();
      this.clearResponseTimeInterval();
      this.$nextTick(this.scrollToBottom);
    },

    checkChatbotAvailability() {
      this.isChatbotAvailable = user.loggedIn;
      if (this.isChatbotAvailable) {
        this.initChat();
      }
    },
    toggleChat(event) {
      event.stopPropagation();
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.$nextTick(this.scrollToBottom);
      }
    },
    async handleSendMessage() {
      if (this.userInput.trim() === '' || this.isWaiting) return;

      const sentMessage = this.userInput;
      this.setWaitingState();

      try {
        // Pass useTools in the payload object
        await this.sendMessage({ newMessage: sentMessage, useTools: this.useTools });
        this.playNotificationSound();
      } catch (error) {
        console.error('Error in sending message:', error);
      } finally {
        this.clearWaitingState();
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
      clearInterval(this.waitingMessageInterval);
    },
    startResponseTimeCounter() {
      this.responseTime = 0;
      this.responseTimeInterval = setInterval(() => {
        this.responseTime++;
      }, 1000);
    },
    clearResponseTimeInterval() {
      clearInterval(this.responseTimeInterval);
    },
    async handleRestartChat() {
      try {
        await user.resetAiChat();
        await this.restartChat();
        this.$nextTick(this.scrollToBottom);
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
        this.startX = event.clientX || event.touches[0].clientX;
        this.startY = event.clientY || event.touches[0].clientY;
        this.startTop = this.chatTop;
        this.startLeft = this.chatLeft;
      }
    },
    startResizing(event) {
      event.preventDefault();
      this.isResizing = true;
      this.startX = event.clientX || event.touches[0].clientX;
      this.startY = event.clientY || event.touches[0].clientY;
      this.startWidth = this.chatWidth;
      this.startHeight = this.chatHeight;
      this.startTop = this.chatTop;
      this.startLeft = this.chatLeft;
    },
    onMouseMove(event) {
      if (this.isDragging) {
        this.onDragging(event);
      } else if (this.isResizing) {
        this.onResizing(event);
      }
    },
    onTouchMove(event) {
      if (this.isDragging) {
        this.onDragging(event);
      } else if (this.isResizing) {
        this.onResizing(event);
      }
    },
    onDragging(event) {
      const clientX = event.clientX || event.touches[0].clientX;
      const clientY = event.clientY || event.touches[0].clientY;
      const deltaX = clientX - this.startX;
      const deltaY = clientY - this.startY;

      this.chatLeft = Math.max(0, Math.min(window.innerWidth - this.chatWidth, this.startLeft + deltaX));
      this.chatTop = Math.max(0, Math.min(window.innerHeight - this.chatHeight, this.startTop + deltaY));
    },
    onResizing(event) {
      const clientX = event.clientX || event.touches[0].clientX;
      const clientY = event.clientY || event.touches[0].clientY;
      const deltaX = clientX - this.startX;
      const deltaY = clientY - this.startY;

      // Calculate new width and height
      const newWidth = Math.max(300, this.startWidth + deltaX);
      const newHeight = Math.max(400, this.startHeight + deltaY);

      // Ensure the chatbot doesn't resize beyond the window boundaries
      this.chatWidth = Math.min(newWidth, window.innerWidth - this.startLeft);
      this.chatHeight = Math.min(newHeight, window.innerHeight - this.startTop);
    },
    onMouseUp() {
      this.isDragging = false;
      this.isResizing = false;
    },
    onTouchEnd() {
      this.isDragging = false;
      this.isResizing = false;
    },
    initChat() {
      this.handleRestartChat();
    },
    playNotificationSound() {
    this.$refs.notificationSound.play();
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
  transition: width 0.1s ease, height 0.1s ease;
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
  /* Original height: calc(100% - 50px); */
  /* Adjust based on header (40px) + options (approx 35px) */
  height: calc(100% - 75px);
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

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  cursor: se-resize;
  background-color: #4CAF50;
  border-radius: 0 0 10px 0;
  transition: background-color 0.3s ease;
}

.resize-handle.resizing {
  background-color: #2196F3;
}

.resize-handle::before {
  content: '';
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 5px;
  height: 5px;
  background-color: white;
  box-shadow: 0 -6px 0 0 white, 0 -12px 0 0 white, -6px 0 0 0 white, -12px 0 0 0 white, -6px -6px 0 0 white;
}

.markdown-body {
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.markdown-body p {
  margin-bottom: 10px;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27,31,35,0.05);
  border-radius: 3px;
}

.markdown-body pre {
  word-wrap: normal;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
}

.markdown-body pre code {
  display: inline;
  max-width: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border: 0;
}

.markdown-body blockquote {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 2em;
}

.markdown-body table {
  display: block;
  width: 100%;
  overflow: auto;
  border-spacing: 0;
  border-collapse: collapse;
}

.markdown-body table th,
.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

.markdown-body img {
  max-width: 100%;
  box-sizing: content-box;
}

.bot-message {
  position: relative;
  padding-right: 30px; /* Add some padding to the right to accommodate the button */
}

.regenerate-button {
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  color: #4CAF50;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.7;
  transition: opacity 0.3s ease;
  padding: 2px;
}

.regenerate-button:hover {
  opacity: 1;
}

</style>

/* Add these styles at the end of the <style scoped> block */
.ai-chatbot-options {
  padding: 8px 10px;
  background-color: #f8f9fa; /* Light background */
  border-bottom: 1px solid #e0e0e0; /* Separator line */
  font-size: 0.9em;
}

.ai-chatbot-options label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.ai-chatbot-options input[type="checkbox"] {
  margin-right: 5px;
}
