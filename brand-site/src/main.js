import {createWebHistory, createRouter} from "vue-router";
import {createApp} from 'vue'
import App from './App.vue'
import RouterView from "@/routes/RouterView.vue";
import i18n from "@/i18n";

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

createApp(App).use(router).use(i18n).mount('#app')
