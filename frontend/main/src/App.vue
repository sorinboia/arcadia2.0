<script>
import appConfig from "@/app.config";

import { notificationMethods } from "@/state/helpers";
import { mapGetters, mapActions } from 'vuex';


function startPooling() {
  this.pooler = setInterval(()=> {
    this.getAllStockTicker();

  },1000);
}


export default {
  name: "app",
  page: {
    // All subcomponent titles will be injected into this template.
    titleTemplate(title) {
      title = typeof title === "function" ? title(this.$store) : title;
      return title ? `${title} | ${appConfig.title}` : appConfig.title;
    }
  },
  mounted() {
    if (this.loggedIn && this.pooler == null) {
      startPooling.apply(this);
    }
  },
  data() { return {
    user: this.currentUser,
    pooler:null,
  }},
  watch: {
    /**
     * Clear the alert message on route change
     */
    // eslint-disable-next-line no-unused-vars
    $route(to, from) {
      // clear alert on location change
      this.clearNotification();
    },
    loggedIn: function(oldVal,newVal) {
      if (this.loggedIn) {
        startPooling.apply(this);
      } else {
        clearInterval(this.pooler);
      }
    }
  },
  computed: {
    ...mapGetters('auth',['loggedIn'])
  },
  methods: {
    ...mapActions('stock',['getAllStockTicker']),
    clearNotification: notificationMethods.clear
  }
};
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

