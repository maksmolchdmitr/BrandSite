import { createI18n } from "vue-i18n";

export const LOCALE_STORAGE_KEY = "brand-site.locale";
const SUPPORTED_LOCALES = ["en", "ru"];
const DEFAULT_LOCALE = "en";

const messages = {
  en: {
    common: {
      nav: {
        main: "Main",
        touchMe: "Touch me",
        products: "Products",
        badminton: "Badminton",
      },
      pager: {
        page: "Page {page}",
        perPage: "Per page:",
      },
      actions: {
        refresh: "Refresh",
        loading: "Loading...",
        cancel: "Cancel",
        save: "Save",
        create: "Create",
        add: "Add",
        edit: "Edit",
        delete: "Delete",
        logout: "Logout",
        link: "Link",
        backToProducts: "← Back to products",
      },
      placeholders: {
        searchParticipant: "Search participant...",
        searchParticipant1: "Search participant 1...",
        searchParticipant2: "Search participant 2...",
      },
      misc: {
        noData: "—",
      },
    },
    languageSwitcher: {
      en: "en",
      ru: "ру",
    },
    brand: {
      name: "MaksMolch",
    },
    main: {
      name: "Maks",
      intro: "Hi, I'm {name}",
      introLine2: "I work as Backend Software Engineer and have studied at HSE",
      experiences: {
        first:
          "Joined *Yandex Market Ads* as a backend engineer.\n\nOwn full-cycle development of product and infrastructure features — from requirements clarification and API design to rollout, monitoring and on-call support in a high-load distributed environment.\n\nWorked on CPM / CPA advertising systems, Game Center mechanics and bonus programs:\n- Built and supported admin APIs, analytics exports (YT + Temporal workflows), billing & targeting integrations\n- Migrated targeting logic from hardcoded rules to configuration-driven YT tables\n- Improved observability through logging and workflow instrumentation\n- Optimized latency and response time of critical endpoints\n- Removed large volumes of legacy code, simplifying architecture and reducing technical debt\n\nKey impact:\n- Led rollout of new game mechanics to 100% of audience → DAU +350%, revenue +78%\n- Built backend infrastructure for multi-creative campaigns, enabling bandit-based optimization (CTR +59.7%, CPC −37.4%)\n- Delivered multiple bonus mechanics improving advertiser engagement and conversion rates",
        second:
          "Backend Engineer at *STM Labs* (B2G).\n\nDeveloped and optimized high-load reactive services (Spring WebFlux + custom RPC framework).\n\n- Integrated distributed tracing into internal RPC library, improving incident investigation\n- Refactored legacy components using clean architecture principles\n- Automated code quality validation and improved CI reliability\n- Contributed to MapReduce-style large-scale data processing pipelines\n- Participated in performance tuning and production incident analysis",
        third:
          "Backend Engineering Intern at *Yandex*.\n\n- Implemented shard banning logic in monitoring balancers while preserving cache persistence in YDB\n- Designed and implemented new endpoints; modified legacy services with full pre-production validation\n- Worked extensively with asynchronous code, actor-based systems and distributed architecture\n- Analyzed traces and logs to identify and resolve production-level issues",
        fourth:
          "Founder at *Random Walk*.\n\nLed a cross-functional team (mobile, QA, design, backend).\n\n- Designed and implemented a distributed WebSocket-based backend service\n- Developed a dynamic GraphQL-based web platform\n- Managed product lifecycle from ideation to production release\n\nGitHub – https://github.com/ru-random-walk",
      },
    },
    touchMe: {
      spin: "Spin",
      spinAlt: "Spin links roulette",
      links: {
        telegram: "Telegram",
        linkedIn: "LinkedIn",
        figma: "Figma",
        gmail: "Gmail",
        github: "GitHub",
      },
    },
    products: {
      badmintonTitle: "Badminton Service",
      badmintonSubtitle: "Groups • Matches • Elo • Telegram auth",
    },
    dateSwitch: {
      alt: "Go to another date entry",
    },
    badminton: {
      login: {
        telegramTitle: "Login via Telegram",
        telegramButton: "Login via Telegram",
        telegramHint:
          "A Telegram authorization window will open. Allow pop-ups for this site if nothing appears.",
        mockUsers: "Mock users",
        mockHint: "For testing without Telegram, select a user from the list.",
        userId: "id",
        telegramShort: "tg",
        logoutClear: "Logout (clear session)",
        errOrigin: "Failed to determine page origin",
        errNoServer:
          "Could not connect to server. Check that backend (badminton-service.website) has a valid HTTPS certificate.",
        errTelegram: "Telegram authorization failed",
        errLogin: "Login failed",
        errLogout: "Logout failed",
      },
      groups: {
        title: "My groups",
        myRatings: "My ratings",
        myGames: "My games",
        createGroup: "Create group",
        groupName: "Group name",
        creating: "Creating...",
        groups: "Groups",
        noGroups: "No groups yet.",
        errLoad: "Failed to load groups",
        errCreate: "Failed to create group",
      },
      ratings: {
        title: "My ratings",
        myGames: "My games",
        myGroups: "My groups",
        individual: "Individual Elo Rating",
        doublesByPartner: "Doubles Elo by Partner",
        ratingHint: "Rating is calculated by Elo after each game.",
        noDoubles: "No doubles games yet.",
        player: "Player",
        partner: "Partner",
        games: "Games",
        wins: "Wins",
        losses: "Losses",
        elo: "Elo",
        errLoad: "Failed to load ratings",
        errNext: "Failed to load next page",
      },
      gamesHub: {
        title: "My games",
        myRatings: "My ratings",
        myGroups: "My groups",
        singlesTitle: "Singles Games",
        singlesDesc: "View and browse your singles matches",
        doublesTitle: "Doubles Games",
        doublesDesc: "View and browse your doubles matches",
      },
      singles: {
        title: "Singles Games",
        backToGames: "← My games",
        myRatings: "My ratings",
        myGroups: "My groups",
        cardTitle: "Singles Games",
        empty: "No singles games yet.",
        player1: "Player 1",
        player2: "Player 2",
        score: "Score",
        date: "Date",
        played: "Played",
        won: "Won",
        lost: "Lost",
        winRate: "Win rate",
        errLoad: "Failed to load singles games",
        errNext: "Failed to load next page",
      },
      doubles: {
        title: "Doubles Games",
        backToGames: "← My games",
        myRatings: "My ratings",
        myGroups: "My groups",
        cardTitle: "Doubles Games",
        empty: "No doubles games yet.",
        team1p1: "Team 1 P1",
        team1p2: "Team 1 P2",
        team2p1: "Team 2 P1",
        team2p2: "Team 2 P2",
        score: "Score",
        date: "Date",
        played: "Played",
        won: "Won",
        lost: "Lost",
        winRate: "Win rate",
        errLoad: "Failed to load doubles games",
        errNext: "Failed to load next page",
      },
      group: {
        participants: "Participants",
        participantName: "Participant name",
        adding: "Adding...",
        actions: "Actions",
        noParticipants: "No participants yet.",
        matches: "Matches",
        singles: "Singles",
        doubles: "Doubles",
        singlesMatch: "Singles match",
        doublesMatch: "Doubles match",
        noMatches: "No matches yet.",
        leaderboards: "Leaderboards (Elo)",
        refreshLeaderboards: "Refresh leaderboards",
        singlesLeaderboard: "Singles Leaderboard",
        doublesLeaderboard: "Doubles Leaderboard",
        team: "Team",
        name: "Name",
        userId: "User ID",
        editParticipant: "Edit participant",
        linkUser: "Link user to participant",
        createMatch: "Create {kind} match",
        editMatch: "Edit {kind} match",
        errLoadGroup: "Failed to load group",
        errLoad: "Failed to load data",
        errNextPage: "Failed to load next page",
        errAddParticipant: "Failed to add participant",
        errUpdateParticipant: "Failed to update participant",
        errLinkUser: "Failed to link user",
        errDeleteParticipant: "Failed to delete participant",
        errSaveMatch: "Failed to save match",
        errDeleteMatch: "Failed to delete match",
        confirmDeleteParticipant: "Delete participant \"{name}\"?",
        confirmDeleteMatch: "Delete match {id}?",
        team1: "Team 1",
        team2: "Team 2",
        scores: "Scores",
        scorePlaceholder: "21",
        removeScore: "Remove score",
        loadingMore: "Loading more...",
      },
      roles: {
        admin: "admin",
        member: "member",
      },
    },
  },
  ru: {
    common: {
      nav: {
        main: "Главная",
        touchMe: "Контакты",
        products: "Продукты",
        badminton: "Бадминтон",
      },
      pager: {
        page: "Страница {page}",
        perPage: "На странице:",
      },
      actions: {
        refresh: "Обновить",
        loading: "Загрузка...",
        cancel: "Отмена",
        save: "Сохранить",
        create: "Создать",
        add: "Добавить",
        edit: "Изменить",
        delete: "Удалить",
        logout: "Выйти",
        link: "Связать",
        backToProducts: "← Назад к продуктам",
      },
      placeholders: {
        searchParticipant: "Поиск участника...",
        searchParticipant1: "Поиск участника 1...",
        searchParticipant2: "Поиск участника 2...",
      },
      misc: {
        noData: "—",
      },
    },
    languageSwitcher: {
      en: "en",
      ru: "ру",
    },
    brand: {
      name: "Максим Молчанов",
    },
    main: {
      name: "Макс",
      intro: "Привет, я {name}",
      introLine2: "Работаю Backend Software Engineer и учился в НИУ ВШЭ",
      experiences: {
        first:
          "Присоединился к *Yandex Market Ads* как бекенд-инженер.\n\nВёл полный цикл разработки продуктовых и инфраструктурных фич — от уточнения требований и проектирования API до выката, мониторинга и on-call поддержки в высоконагруженной распределённой среде.\n\nРаботал с рекламными системами CPM / CPA, игровыми механиками вовлечения и бонусными программами:\n- Разрабатывал и поддерживал API для админов игр, аналитические выгрузки (YT + Temporal workflows), интеграции биллинга и таргетинга\n- Перенёс таргетинг с захардкоженных правил на конфигурацию в YT-таблицах\n- Улучшил наблюдаемость  через логирование и инструментирование workflow\n- Оптимизировал задержки и время ответа критичных ручек\n- Удалил большие объёмы legacy-кода, упростив архитектуру и сократив техдолг\n\nКлючевой результат:\n- Вывел новые игровые механики на 100% аудитории → DAU +350%, выручка +78%\n- Построил backend-инфраструктуру для поддержки нескольких вариантов креативов в рекламных кампаниях с bandit-оптимизацией (CTR +59.7%, CPC −37.4%)\n- Запустил несколько бонусных механик, повысивших вовлечённость и конверсию рекламодателей",
        second:
          "Backend Engineer в *STM Labs* (B2G).\n\nРазрабатывал и оптимизировал высоконагруженные реактивные сервисы (Spring WebFlux + собственный RPC-фреймворк).\n\n- Интегрировал distributed tracing во внутреннюю RPC-библиотеку, ускорив разбор инцидентов\n- Рефакторил legacy-компоненты по принципам clean architecture\n- Автоматизировал проверки качества кода и повысил стабильность CI\n- Участвовал в разработке MapReduce-подобных пайплайнов обработки больших данных\n- Участвовал в performance tuning и разборе продакшн-инцидентов",
        third:
          "Стажёр Backend Engineering в *Yandex*.\n\n- Реализовал shard banning в мониторинговых балансерах с сохранением cache persistence в YDB\n- Проектировал и внедрял новые эндпоинты, дорабатывал legacy-сервисы с полной предрелизной валидацией\n- Много работал с асинхронным кодом, actor-based системами и распределённой архитектурой\n- Анализировал трассировки и логи для поиска и устранения production-проблем",
        fourth:
          "Основатель *Random Walk*.\n\nРуководил кросс-функциональной командой (mobile, QA, design, backend).\n\n- Спроектировал и реализовал распределённый backend-сервис на WebSocket\n- Разработал динамическую web-платформу на GraphQL\n- Вёл продукт от идеи до production-релиза\n\nGitHub – https://github.com/ru-random-walk",
      },
    },
    touchMe: {
      spin: "Крутить",
      spinAlt: "Рулетка ссылок",
      links: {
        telegram: "Телеграм",
        linkedIn: "Заморский Хэха",
        figma: "Фигма",
        gmail: "Почта",
        github: "Гитхаб",
      },
    },
    products: {
      badmintonTitle: "Сервис бадминтона",
      badmintonSubtitle: "Группы • Матчи • Elo • Telegram auth",
    },
    dateSwitch: {
      alt: "Перейти к другой дате",
    },
    badminton: {
      login: {
        telegramTitle: "Вход через Telegram",
        telegramButton: "Войти через Telegram",
        telegramHint:
          "Откроется окно авторизации Telegram. Разрешите всплывающие окна для этого сайта, если окно не открылось.",
        mockUsers: "Тестовые пользователи",
        mockHint: "Для теста без Telegram выберите пользователя из списка.",
        userId: "id",
        telegramShort: "тг",
        logoutClear: "Выйти (очистить сессию)",
        errOrigin: "Не удалось определить origin страницы",
        errNoServer:
          "Не удалось подключиться к серверу. Проверьте, что у бэкенда (badminton-service.website) настроен валидный HTTPS-сертификат.",
        errTelegram: "Ошибка авторизации через Telegram",
        errLogin: "Ошибка входа",
        errLogout: "Ошибка выхода",
      },
      groups: {
        title: "Мои группы",
        myRatings: "Мои рейтинги",
        myGames: "Мои игры",
        createGroup: "Создать группу",
        groupName: "Название группы",
        creating: "Создание...",
        groups: "Группы",
        noGroups: "Групп пока нет.",
        errLoad: "Не удалось загрузить группы",
        errCreate: "Не удалось создать группу",
      },
      ratings: {
        title: "Мои рейтинги",
        myGames: "Мои игры",
        myGroups: "Мои группы",
        individual: "Индивидуальный рейтинг Elo",
        doublesByPartner: "Парный Elo по партнёрам",
        ratingHint: "Рейтинг рассчитывается по системе Elo после каждой игры.",
        noDoubles: "Пока нет парных игр.",
        player: "Игрок",
        partner: "Партнёр",
        games: "Игры",
        wins: "Победы",
        losses: "Поражения",
        elo: "Elo",
        errLoad: "Не удалось загрузить рейтинги",
        errNext: "Не удалось загрузить следующую страницу",
      },
      gamesHub: {
        title: "Мои игры",
        myRatings: "Мои рейтинги",
        myGroups: "Мои группы",
        singlesTitle: "Одиночные игры",
        singlesDesc: "Просмотр и история ваших одиночных матчей",
        doublesTitle: "Парные игры",
        doublesDesc: "Просмотр и история ваших парных матчей",
      },
      singles: {
        title: "Одиночные игры",
        backToGames: "← Мои игры",
        myRatings: "Мои рейтинги",
        myGroups: "Мои группы",
        cardTitle: "Одиночные игры",
        empty: "Пока нет одиночных игр.",
        player1: "Игрок 1",
        player2: "Игрок 2",
        score: "Счёт",
        date: "Дата",
        played: "Сыграно",
        won: "Победы",
        lost: "Поражения",
        winRate: "Винрейт",
        errLoad: "Не удалось загрузить одиночные игры",
        errNext: "Не удалось загрузить следующую страницу",
      },
      doubles: {
        title: "Парные игры",
        backToGames: "← Мои игры",
        myRatings: "Мои рейтинги",
        myGroups: "Мои группы",
        cardTitle: "Парные игры",
        empty: "Пока нет парных игр.",
        team1p1: "Команда 1 И1",
        team1p2: "Команда 1 И2",
        team2p1: "Команда 2 И1",
        team2p2: "Команда 2 И2",
        score: "Счёт",
        date: "Дата",
        played: "Сыграно",
        won: "Победы",
        lost: "Поражения",
        winRate: "Винрейт",
        errLoad: "Не удалось загрузить парные игры",
        errNext: "Не удалось загрузить следующую страницу",
      },
      group: {
        participants: "Участники",
        participantName: "Имя участника",
        adding: "Добавление...",
        actions: "Действия",
        noParticipants: "Пока нет участников.",
        matches: "Матчи",
        singles: "Одиночные",
        doubles: "Парные",
        singlesMatch: "одиночный матч",
        doublesMatch: "парный матч",
        noMatches: "Пока нет матчей.",
        leaderboards: "Лидерборды (Elo)",
        refreshLeaderboards: "Обновить лидерборды",
        singlesLeaderboard: "Лидерборд одиночных",
        doublesLeaderboard: "Лидерборд парных",
        team: "Команда",
        name: "Имя",
        userId: "ID пользователя",
        editParticipant: "Изменить участника",
        linkUser: "Связать пользователя с участником",
        createMatch: "Создать матч ({kind})",
        editMatch: "Изменить матч ({kind})",
        errLoadGroup: "Не удалось загрузить группу",
        errLoad: "Не удалось загрузить данные",
        errNextPage: "Не удалось загрузить следующую страницу",
        errAddParticipant: "Не удалось добавить участника",
        errUpdateParticipant: "Не удалось обновить участника",
        errLinkUser: "Не удалось связать пользователя",
        errDeleteParticipant: "Не удалось удалить участника",
        errSaveMatch: "Не удалось сохранить матч",
        errDeleteMatch: "Не удалось удалить матч",
        confirmDeleteParticipant: "Удалить участника \"{name}\"?",
        confirmDeleteMatch: "Удалить матч {id}?",
        team1: "Команда 1",
        team2: "Команда 2",
        scores: "Счёт",
        scorePlaceholder: "21",
        removeScore: "Удалить счёт",
        loadingMore: "Загрузка...",
      },
      roles: {
        admin: "админ",
        member: "участник",
      },
    },
  },
};

function getInitialLocale() {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const fromStorage = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (SUPPORTED_LOCALES.includes(fromStorage)) return fromStorage;
  return DEFAULT_LOCALE;
}

export function setStoredLocale(locale) {
  if (typeof window === "undefined") return;
  if (!SUPPORTED_LOCALES.includes(locale)) return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function applyLocaleToDocument(locale) {
  if (typeof document === "undefined") return;
  const safeLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  document.documentElement.lang = safeLocale;
  document.documentElement.setAttribute("data-locale", safeLocale);
}

const i18n = createI18n({
  legacy: true,
  locale: getInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
});

export default i18n;
