import {createWebHistory, createRouter} from "vue-router";
import {createApp} from 'vue'
import App from './App.vue'
import RouterView from "@/routes/RouterView.vue";
import LoadingPhrase from "@/components/LoadingPhrase.vue";
import i18n from "@/i18n";
import {setReauthRedirectHandler} from "@/badminton/apiHelpers.js";

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

setReauthRedirectHandler(() => {
    const { page, section } = router.currentRoute.value.query;
    if (page === "badminton" && section === "login") return;
    router.replace("/?page=badminton&section=login");
});

createApp(App)
    .component("LoadingPhrase", LoadingPhrase)
    .use(router)
    .use(i18n)
    .mount('#app')
