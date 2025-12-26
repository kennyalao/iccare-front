<template>
  <!-- 
    The main container for the entire application.
    It uses a flex layout to ensure the content area expands to fill the space
    between the Header and an optional Footer (not included here).
  -->
  <div id="app-container">
    
    <!-- 1. Global Header: Always visible, contains navigation and sign-out logic -->
    <Header />

    <!-- 2. Main Content Area: Renders the component corresponding to the current route -->
    <main class="content-wrapper">
      <router-view />
    </main>

    <!-- 3. Optional Footer Component -->
    <!-- <Footer /> -->

  </div>
</template>

<script setup>
import Header from './components/layout/Header.vue';
// Note: Vue 3 does not require explicit component registration if using a build step (like Vite/Vue CLI)
// and naming convention is followed (e.g., Header.vue -> <Header>)
</script>

<style>
/* Global styles for the App component and overall layout structure.
  Note: This block uses the standard <style> tag, meaning these styles are global 
  unless scoped (which they aren't here, as they define the root structure).
*/

/* Basic CSS Reset/Normalization */
body {
    margin: 0;
    padding: 0;
    font-family: 'Roboto', sans-serif;
    background-color: #f4f6f8; /* Light background from index.html */
}

#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ensures the container fills the entire viewport height */
}

/* Style for the main content area */
.content-wrapper {
  flex-grow: 1; /* Allows the content area to expand and push the footer down (if present) */
  padding-top: 20px;
  padding-bottom: 20px;
}

/* Global transitions for smoother routing */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
