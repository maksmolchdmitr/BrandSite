import {createMemoryHistory, createRouter} from "vue-router";
import {createApp} from 'vue'
import App from './App.vue'
import TouchMe from "@/routes/TouchMe.vue";
import Products from "@/routes/Products.vue";
import Main from "@/routes/Main.vue";
import BadmintonService from "@/routes/BadmintonService.vue";
import BadmintonLogin from "@/routes/BadmintonLogin.vue";
import BadmintonGroups from "@/routes/BadmintonGroups.vue";
import BadmintonGroup from "@/routes/BadmintonGroup.vue";
import BadmintonRatings from "@/routes/BadmintonRatings.vue";
import BadmintonGames from "@/routes/BadmintonGames.vue";

const routes = [
    {path: '/', component: Main},
    {path: '/contact', component: TouchMe},
    {path: '/products', component: Products},
    {path: '/badminton-service', component: BadmintonService},
    {path: '/badminton-service/login', component: BadmintonLogin},
    {path: '/badminton-service/groups', component: BadmintonGroups},
    {path: '/badminton-service/groups/:groupId', component: BadmintonGroup, props: true},
    {path: '/badminton-service/ratings', component: BadmintonRatings},
    {path: '/badminton-service/games', component: BadmintonGames},
]

const router = createRouter({
    history: createMemoryHistory(),
    routes
})

createApp(App).use(router).mount('#app')
