import {createMemoryHistory, createRouter} from "vue-router";
import {createApp} from 'vue'
import App from './App.vue'
import TouchMe from "@/routes/TouchMe.vue";
import Products from "@/routes/Products.vue";
import Main from "@/routes/Main.vue";

const routes = [
    {path: '/', component: Main},
    {path: '/contact', component: TouchMe},
    {path: '/products', component: Products},
]

const router = createRouter({
    history: createMemoryHistory(),
    routes
})

createApp(App).use(router).mount('#app')
