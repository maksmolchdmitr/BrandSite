# brand-site

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Переключение на реальный бекенд (Badminton API)

По умолчанию фронт работает с **моками**. Чтобы ходить в реальный бекенд:

1. Скопируй пример env-файла и отредактируй:
   ```sh
   cp env.example .env
   ```
2. В `.env` выстави:
   - `VITE_BADMINTON_USE_MOCKS=false` — использовать реальный API
   - `VITE_BADMINTON_API_BASE_URL=http://localhost:8080` (или URL твоего бека)
3. Перезапусти dev-сервер (`npm run dev`).

В консоли браузера в режиме разработки будет лог: `Badminton client: REAL API` и URL базы.
