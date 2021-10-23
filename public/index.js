// Establish a Socket.io connection
const socket = io();
// Initialize our Feathers client application through Socket.io
// with hooks and authentication.
const client = feathers();

client.configure(feathers.socketio(socket));
// Use localStorage to store our login token
client.configure(feathers.authentication());


const options = {
  moduleCache: {
    vue: Vue
  },
  async getFile(url) {
    
    const res = await fetch(url);
    if ( !res.ok )
      throw Object.assign(new Error(res.statusText + ' ' + url), { res });
    return {
      getContentData: asBinary => asBinary ? res.arrayBuffer() : res.text(),
    }
  },
  addStyle(textContent) {

    const style = Object.assign(document.createElement('style'), { textContent });
    const ref = document.head.getElementsByTagName('style')[0] || null;
    document.head.insertBefore(style, ref);
  },
}

const { loadModule } = window['vue3-sfc-loader'];

const app = Vue.createApp({
  components: {
    'login': Vue.defineAsyncComponent( () => loadModule('./login.vue', options) )
  },
  template: '<login></login>',
});

app.mount('#app');