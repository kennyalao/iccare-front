import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Imports the Vue Router configuration

// --- Global CSS (Optional) ---
// You can import global styles here if needed.
// import './assets/styles/global.css';

// 1. Create the Vue application instance
const app = createApp(App);

// 2. Install the router instance
app.use(router);

// 3. Mount the application to the DOM
// This connects the entire Vue application to the <div id="app"> element 
// defined in public/index.html.
app.mount('#app');

console.log('Vue application mounted successfully.');
