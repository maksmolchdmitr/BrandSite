import {createWebHistory, createRouter} from "vue-router";
import {createApp} from 'vue'
import App from './App.vue'
import RouterView from "@/routes/RouterView.vue";

const routes = [
    {
        path: '/',
        component: RouterView
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

createApp(App).use(router).mount('#app')
