import {getLoggedInUserId} from "@/badminton/cookies.js";

const DB_KEY = "badminton.mockdb.v2"; // Updated to v2 to force reseed with more participants

function uuid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function seedDb() {
  // Users based on CSV - create users for those with telegram accounts or main players
  const users = [
    {id: "u_maks", telegramId: 10001, username: "maks", displayName: "Молчанов Максим", createdAt: nowIso()},
    {id: "u_boris", telegramId: 10002, username: "boris", displayName: "Борис [Семенов]", createdAt: nowIso()},
    {id: "u_anna", telegramId: 10003, username: "anna", displayName: "Анна Грачева", createdAt: nowIso()},
    {id: "u_roma", telegramId: 10004, username: "roma", displayName: "Рома", createdAt: nowIso()},
    {id: "u_masha", telegramId: 10005, username: "masha", displayName: "Маша", createdAt: nowIso()},
    {id: "u_zhenya", telegramId: 10006, username: "zhenya", displayName: "Женя", createdAt: nowIso()},
  ];

  const groups = [
    {id: "g_semenov", name: "Бадминтон в Семенове", createdAt: nowIso(), createdByUserId: "u_maks"},
  ];

  const memberships = [
    {groupId: "g_semenov", userId: "u_maks", role: "admin"},
    {groupId: "g_semenov", userId: "u_boris", role: "member"},
    {groupId: "g_semenov", userId: "u_anna", role: "member"},
    {groupId: "g_semenov", userId: "u_roma", role: "member"},
    {groupId: "g_semenov", userId: "u_masha", role: "member"},
    {groupId: "g_semenov", userId: "u_zhenya", role: "member"},
  ];

  // Participants based on CSV "Информация об игроках" + additional for pagination testing
  const participants = [
    {id: "p_maks", groupId: "g_semenov", name: "Молчанов Максим", userId: "u_maks", createdAt: nowIso()},
    {id: "p_ksenia", groupId: "g_semenov", name: "Ксения Буслеева", userId: null, createdAt: nowIso()},
    {id: "p_nikita", groupId: "g_semenov", name: "Никита Курицин", userId: null, createdAt: nowIso()},
    {id: "p_alexander", groupId: "g_semenov", name: "Alexander Chernigin", userId: null, createdAt: nowIso()},
    {id: "p_boris", groupId: "g_semenov", name: "Борис [Семенов]", userId: "u_boris", createdAt: nowIso()},
    {id: "p_anna", groupId: "g_semenov", name: "Анна Грачева", userId: "u_anna", createdAt: nowIso()},
    {id: "p_roma", groupId: "g_semenov", name: "Рома", userId: "u_roma", createdAt: nowIso()},
    {id: "p_yulya", groupId: "g_semenov", name: "Юля", userId: null, createdAt: nowIso()},
    {id: "p_arseniy", groupId: "g_semenov", name: "Арсений", userId: null, createdAt: nowIso()},
    {id: "p_sveta", groupId: "g_semenov", name: "Света", userId: null, createdAt: nowIso()},
    {id: "p_liana", groupId: "g_semenov", name: "Лиана", userId: null, createdAt: nowIso()},
    {id: "p_zhenya_new", groupId: "g_semenov", name: "Женя (новенький)", userId: null, createdAt: nowIso()},
    {id: "p_andrey", groupId: "g_semenov", name: "Андрей", userId: null, createdAt: nowIso()},
    {id: "p_kostya", groupId: "g_semenov", name: "Костя", userId: null, createdAt: nowIso()},
    {id: "p_valeriy", groupId: "g_semenov", name: "Валерий", userId: null, createdAt: nowIso()},
    {id: "p_mikhail", groupId: "g_semenov", name: "Михаил", userId: null, createdAt: nowIso()},
    {id: "p_elya", groupId: "g_semenov", name: "Эля", userId: null, createdAt: nowIso()},
    {id: "p_masha", groupId: "g_semenov", name: "Маша", userId: "u_masha", createdAt: nowIso()},
    {id: "p_zhenya", groupId: "g_semenov", name: "Женя", userId: "u_zhenya", createdAt: nowIso()},
    {id: "p_marina", groupId: "g_semenov", name: "Марина", userId: null, createdAt: nowIso()},
    {id: "p_serega", groupId: "g_semenov", name: "Серега", userId: null, createdAt: nowIso()},
    {id: "p_vadim", groupId: "g_semenov", name: "Вадим", userId: null, createdAt: nowIso()},
    {id: "p_alena", groupId: "g_semenov", name: "Алена", userId: null, createdAt: nowIso()},
    {id: "p_gleb", groupId: "g_semenov", name: "Глеб", userId: null, createdAt: nowIso()},
    {id: "p_sveta_other", groupId: "g_semenov", name: "другая Света", userId: null, createdAt: nowIso()},
    {id: "p_lena", groupId: "g_semenov", name: "Лена", userId: null, createdAt: nowIso()},
    {id: "p_yulya_arseniy", groupId: "g_semenov", name: "Юля(с Арсением)", userId: null, createdAt: nowIso()},
    {id: "p_kostya_old", groupId: "g_semenov", name: "Костя(старший)", userId: null, createdAt: nowIso()},
    {id: "p_anya", groupId: "g_semenov", name: "Аня", userId: null, createdAt: nowIso()},
    // Additional participants for pagination testing
    {id: "p_alex", groupId: "g_semenov", name: "Алексей", userId: null, createdAt: nowIso()},
    {id: "p_dmitry", groupId: "g_semenov", name: "Дмитрий", userId: null, createdAt: nowIso()},
    {id: "p_ivan", groupId: "g_semenov", name: "Иван", userId: null, createdAt: nowIso()},
    {id: "p_pavel", groupId: "g_semenov", name: "Павел", userId: null, createdAt: nowIso()},
    {id: "p_sergey", groupId: "g_semenov", name: "Сергей", userId: null, createdAt: nowIso()},
    {id: "p_vladimir", groupId: "g_semenov", name: "Владимир", userId: null, createdAt: nowIso()},
    {id: "p_olga", groupId: "g_semenov", name: "Ольга", userId: null, createdAt: nowIso()},
    {id: "p_elena", groupId: "g_semenov", name: "Елена", userId: null, createdAt: nowIso()},
    {id: "p_tatyana", groupId: "g_semenov", name: "Татьяна", userId: null, createdAt: nowIso()},
    {id: "p_natalia", groupId: "g_semenov", name: "Наталья", userId: null, createdAt: nowIso()},
    {id: "p_irina", groupId: "g_semenov", name: "Ирина", userId: null, createdAt: nowIso()},
    {id: "p_ekaterina", groupId: "g_semenov", name: "Екатерина", userId: null, createdAt: nowIso()},
    {id: "p_maria", groupId: "g_semenov", name: "Мария", userId: null, createdAt: nowIso()},
    {id: "p_anastasia", groupId: "g_semenov", name: "Анастасия", userId: null, createdAt: nowIso()},
    {id: "p_daria", groupId: "g_semenov", name: "Дарья", userId: null, createdAt: nowIso()},
    {id: "p_sofia", groupId: "g_semenov", name: "София", userId: null, createdAt: nowIso()},
    {id: "p_victoria", groupId: "g_semenov", name: "Виктория", userId: null, createdAt: nowIso()},
    {id: "p_polina", groupId: "g_semenov", name: "Полина", userId: null, createdAt: nowIso()},
    {id: "p_veronika", groupId: "g_semenov", name: "Вероника", userId: null, createdAt: nowIso()},
    {id: "p_artem", groupId: "g_semenov", name: "Артем", userId: null, createdAt: nowIso()},
    {id: "p_maxim", groupId: "g_semenov", name: "Максим", userId: null, createdAt: nowIso()},
    {id: "p_danil", groupId: "g_semenov", name: "Данил", userId: null, createdAt: nowIso()},
    {id: "p_kirill", groupId: "g_semenov", name: "Кирилл", userId: null, createdAt: nowIso()},
    {id: "p_ilya", groupId: "g_semenov", name: "Илья", userId: null, createdAt: nowIso()},
    {id: "p_matvey", groupId: "g_semenov", name: "Матвей", userId: null, createdAt: nowIso()},
    {id: "p_lev", groupId: "g_semenov", name: "Лев", userId: null, createdAt: nowIso()},
    {id: "p_mark", groupId: "g_semenov", name: "Марк", userId: null, createdAt: nowIso()},
    {id: "p_roman", groupId: "g_semenov", name: "Роман", userId: null, createdAt: nowIso()},
    {id: "p_timur", groupId: "g_semenov", name: "Тимур", userId: null, createdAt: nowIso()},
    {id: "p_arsen", groupId: "g_semenov", name: "Арсен", userId: null, createdAt: nowIso()},
    {id: "p_leonid", groupId: "g_semenov", name: "Леонид", userId: null, createdAt: nowIso()},
    {id: "p_yaroslav", groupId: "g_semenov", name: "Ярослав", userId: null, createdAt: nowIso()},
    {id: "p_egor", groupId: "g_semenov", name: "Егор", userId: null, createdAt: nowIso()},
    {id: "p_fedor", groupId: "g_semenov", name: "Федор", userId: null, createdAt: nowIso()},
    {id: "p_georgy", groupId: "g_semenov", name: "Георгий", userId: null, createdAt: nowIso()},
    {id: "p_platon", groupId: "g_semenov", name: "Платон", userId: null, createdAt: nowIso()},
    {id: "p_denis", groupId: "g_semenov", name: "Денис", userId: null, createdAt: nowIso()},
    {id: "p_anton", groupId: "g_semenov", name: "Антон", userId: null, createdAt: nowIso()},
    {id: "p_igor", groupId: "g_semenov", name: "Игорь", userId: null, createdAt: nowIso()},
    {id: "p_oleg", groupId: "g_semenov", name: "Олег", userId: null, createdAt: nowIso()},
    {id: "p_vyacheslav", groupId: "g_semenov", name: "Вячеслав", userId: null, createdAt: nowIso()},
    {id: "p_konstantin", groupId: "g_semenov", name: "Константин", userId: null, createdAt: nowIso()},
    {id: "p_nikolay", groupId: "g_semenov", name: "Николай", userId: null, createdAt: nowIso()},
    {id: "p_anatoly", groupId: "g_semenov", name: "Анатолий", userId: null, createdAt: nowIso()},
    {id: "p_valentin", groupId: "g_semenov", name: "Валентин", userId: null, createdAt: nowIso()},
    {id: "p_vasily", groupId: "g_semenov", name: "Василий", userId: null, createdAt: nowIso()},
    {id: "p_petr", groupId: "g_semenov", name: "Петр", userId: null, createdAt: nowIso()},
    {id: "p_boris2", groupId: "g_semenov", name: "Борис", userId: null, createdAt: nowIso()},
    {id: "p_grigory", groupId: "g_semenov", name: "Григорий", userId: null, createdAt: nowIso()},
    {id: "p_evgeny", groupId: "g_semenov", name: "Евгений", userId: null, createdAt: nowIso()},
    {id: "p_aleksandr", groupId: "g_semenov", name: "Александр", userId: null, createdAt: nowIso()},
    {id: "p_andrey2", groupId: "g_semenov", name: "Андрей", userId: null, createdAt: nowIso()},
    {id: "p_vladislav", groupId: "g_semenov", name: "Владислав", userId: null, createdAt: nowIso()},
    {id: "p_rustam", groupId: "g_semenov", name: "Рустам", userId: null, createdAt: nowIso()},
    {id: "p_renat", groupId: "g_semenov", name: "Ренат", userId: null, createdAt: nowIso()},
    {id: "p_ramil", groupId: "g_semenov", name: "Рамиль", userId: null, createdAt: nowIso()},
    {id: "p_rustem", groupId: "g_semenov", name: "Рустем", userId: null, createdAt: nowIso()},
    {id: "p_ildar", groupId: "g_semenov", name: "Ильдар", userId: null, createdAt: nowIso()},
    {id: "p_aydar", groupId: "g_semenov", name: "Айдар", userId: null, createdAt: nowIso()},
    {id: "p_marat", groupId: "g_semenov", name: "Марат", userId: null, createdAt: nowIso()},
    {id: "p_radik", groupId: "g_semenov", name: "Радик", userId: null, createdAt: nowIso()},
    {id: "p_rinat", groupId: "g_semenov", name: "Ринат", userId: null, createdAt: nowIso()},
    {id: "p_almaz", groupId: "g_semenov", name: "Алмаз", userId: null, createdAt: nowIso()},
    {id: "p_ilnur", groupId: "g_semenov", name: "Ильнур", userId: null, createdAt: nowIso()},
    {id: "p_airat", groupId: "g_semenov", name: "Айрат", userId: null, createdAt: nowIso()},
    {id: "p_ruslan", groupId: "g_semenov", name: "Руслан", userId: null, createdAt: nowIso()},
    {id: "p_eldar", groupId: "g_semenov", name: "Эльдар", userId: null, createdAt: nowIso()},
    {id: "p_emil", groupId: "g_semenov", name: "Эмиль", userId: null, createdAt: nowIso()},
    {id: "p_amir", groupId: "g_semenov", name: "Амир", userId: null, createdAt: nowIso()},
    {id: "p_timur2", groupId: "g_semenov", name: "Тимур", userId: null, createdAt: nowIso()},
    {id: "p_daniil", groupId: "g_semenov", name: "Даниил", userId: null, createdAt: nowIso()},
    {id: "p_arslan", groupId: "g_semenov", name: "Арслан", userId: null, createdAt: nowIso()},
    {id: "p_ilyas", groupId: "g_semenov", name: "Ильяс", userId: null, createdAt: nowIso()},
    {id: "p_azat", groupId: "g_semenov", name: "Азат", userId: null, createdAt: nowIso()},
    {id: "p_ainur", groupId: "g_semenov", name: "Айнур", userId: null, createdAt: nowIso()},
    {id: "p_ainaz", groupId: "g_semenov", name: "Айназ", userId: null, createdAt: nowIso()},
    {id: "p_almaz2", groupId: "g_semenov", name: "Алмаз", userId: null, createdAt: nowIso()},
    {id: "p_ilyar", groupId: "g_semenov", name: "Ильяр", userId: null, createdAt: nowIso()},
    {id: "p_radmir", groupId: "g_semenov", name: "Радмир", userId: null, createdAt: nowIso()},
    {id: "p_ramis", groupId: "g_semenov", name: "Рамис", userId: null, createdAt: nowIso()},
    {id: "p_rasim", groupId: "g_semenov", name: "Расим", userId: null, createdAt: nowIso()},
    {id: "p_rafis", groupId: "g_semenov", name: "Рафис", userId: null, createdAt: nowIso()},
    {id: "p_rafail", groupId: "g_semenov", name: "Рафаил", userId: null, createdAt: nowIso()},
    {id: "p_rafat", groupId: "g_semenov", name: "Рафат", userId: null, createdAt: nowIso()},
    {id: "p_rafik", groupId: "g_semenov", name: "Рафик", userId: null, createdAt: nowIso()},
    {id: "p_rafis2", groupId: "g_semenov", name: "Рафис", userId: null, createdAt: nowIso()},
    {id: "p_ramazan", groupId: "g_semenov", name: "Рамазан", userId: null, createdAt: nowIso()},
    {id: "p_ramil2", groupId: "g_semenov", name: "Рамиль", userId: null, createdAt: nowIso()},
    {id: "p_ramis2", groupId: "g_semenov", name: "Рамис", userId: null, createdAt: nowIso()},
    {id: "p_rasim2", groupId: "g_semenov", name: "Расим", userId: null, createdAt: nowIso()},
    {id: "p_rasul", groupId: "g_semenov", name: "Расул", userId: null, createdAt: nowIso()},
    {id: "p_ratmir", groupId: "g_semenov", name: "Ратмир", userId: null, createdAt: nowIso()},
    {id: "p_ravil", groupId: "g_semenov", name: "Равиль", userId: null, createdAt: nowIso()},
    {id: "p_rayan", groupId: "g_semenov", name: "Раян", userId: null, createdAt: nowIso()},
    {id: "p_renat2", groupId: "g_semenov", name: "Ренат", userId: null, createdAt: nowIso()},
    {id: "p_rinat2", groupId: "g_semenov", name: "Ринат", userId: null, createdAt: nowIso()},
    {id: "p_riza", groupId: "g_semenov", name: "Риза", userId: null, createdAt: nowIso()},
    {id: "p_rizvan", groupId: "g_semenov", name: "Ризван", userId: null, createdAt: nowIso()},
    {id: "p_robert", groupId: "g_semenov", name: "Роберт", userId: null, createdAt: nowIso()},
    {id: "p_rodion", groupId: "g_semenov", name: "Родион", userId: null, createdAt: nowIso()},
    {id: "p_roman2", groupId: "g_semenov", name: "Роман", userId: null, createdAt: nowIso()},
    {id: "p_rostislav", groupId: "g_semenov", name: "Ростислав", userId: null, createdAt: nowIso()},
    {id: "p_rustam2", groupId: "g_semenov", name: "Рустам", userId: null, createdAt: nowIso()},
    {id: "p_rustem2", groupId: "g_semenov", name: "Рустем", userId: null, createdAt: nowIso()},
    {id: "p_ruslan2", groupId: "g_semenov", name: "Руслан", userId: null, createdAt: nowIso()},
    {id: "p_ryurik", groupId: "g_semenov", name: "Рюрик", userId: null, createdAt: nowIso()},
    {id: "p_sabir", groupId: "g_semenov", name: "Сабир", userId: null, createdAt: nowIso()},
    {id: "p_said", groupId: "g_semenov", name: "Саид", userId: null, createdAt: nowIso()},
    {id: "p_salavat", groupId: "g_semenov", name: "Салават", userId: null, createdAt: nowIso()},
    {id: "p_salman", groupId: "g_semenov", name: "Салман", userId: null, createdAt: nowIso()},
    {id: "p_samir", groupId: "g_semenov", name: "Самир", userId: null, createdAt: nowIso()},
    {id: "p_samuel", groupId: "g_semenov", name: "Самуэль", userId: null, createdAt: nowIso()},
    {id: "p_sardar", groupId: "g_semenov", name: "Сардар", userId: null, createdAt: nowIso()},
    {id: "p_saveliy", groupId: "g_semenov", name: "Савелий", userId: null, createdAt: nowIso()},
    {id: "p_semen", groupId: "g_semenov", name: "Семен", userId: null, createdAt: nowIso()},
    {id: "p_semyon", groupId: "g_semenov", name: "Семён", userId: null, createdAt: nowIso()},
    {id: "p_serafim", groupId: "g_semenov", name: "Серафим", userId: null, createdAt: nowIso()},
    {id: "p_sergey2", groupId: "g_semenov", name: "Сергей", userId: null, createdAt: nowIso()},
    {id: "p_simon", groupId: "g_semenov", name: "Симон", userId: null, createdAt: nowIso()},
    {id: "p_slavik", groupId: "g_semenov", name: "Славик", userId: null, createdAt: nowIso()},
    {id: "p_solomon", groupId: "g_semenov", name: "Соломон", userId: null, createdAt: nowIso()},
    {id: "p_spartak", groupId: "g_semenov", name: "Спартак", userId: null, createdAt: nowIso()},
    {id: "p_stanislav", groupId: "g_semenov", name: "Станислав", userId: null, createdAt: nowIso()},
    {id: "p_stepan", groupId: "g_semenov", name: "Степан", userId: null, createdAt: nowIso()},
    {id: "p_svyatoslav", groupId: "g_semenov", name: "Святослав", userId: null, createdAt: nowIso()},
    {id: "p_tair", groupId: "g_semenov", name: "Таир", userId: null, createdAt: nowIso()},
    {id: "p_talgat", groupId: "g_semenov", name: "Талгат", userId: null, createdAt: nowIso()},
    {id: "p_tamerlan", groupId: "g_semenov", name: "Тамерлан", userId: null, createdAt: nowIso()},
    {id: "p_taras", groupId: "g_semenov", name: "Тарас", userId: null, createdAt: nowIso()},
    {id: "p_timofey", groupId: "g_semenov", name: "Тимофей", userId: null, createdAt: nowIso()},
    {id: "p_timur3", groupId: "g_semenov", name: "Тимур", userId: null, createdAt: nowIso()},
    {id: "p_tokay", groupId: "g_semenov", name: "Токай", userId: null, createdAt: nowIso()},
    {id: "p_trofim", groupId: "g_semenov", name: "Трофим", userId: null, createdAt: nowIso()},
    {id: "p_ulan", groupId: "g_semenov", name: "Улан", userId: null, createdAt: nowIso()},
    {id: "p_ulugbek", groupId: "g_semenov", name: "Улугбек", userId: null, createdAt: nowIso()},
    {id: "p_umar", groupId: "g_semenov", name: "Умар", userId: null, createdAt: nowIso()},
    {id: "p_ustim", groupId: "g_semenov", name: "Устим", userId: null, createdAt: nowIso()},
    {id: "p_ustim2", groupId: "g_semenov", name: "Устим", userId: null, createdAt: nowIso()},
    {id: "p_ustim3", groupId: "g_semenov", name: "Устим", userId: null, createdAt: nowIso()},
    {id: "p_ustim4", groupId: "g_semenov", name: "Устим", userId: null, createdAt: nowIso()},
    {id: "p_ustim5", groupId: "g_semenov", name: "Устим", userId: null, createdAt: nowIso()},
    {id: "p_ustim6", groupId: "g_semenov", name: "Устим", userId: null, createdAt: nowIso()},
    {id: "p_ustim7", groupId: "g_semenov", name: "Устим", userId: null, createdAt: nowIso()},
    {id: "p_ustim8", groupId: "g_semenov", name: "Устим", userId: null, createdAt: nowIso()},
    {id: "p_ustim9", groupId: "g_semenov", name: "Устим", userId: null, createdAt: nowIso()},
    {id: "p_ustim10", groupId: "g_semenov", name: "Устим", userId: null, createdAt: nowIso()},
  ];

  // Helper to find participant ID by name
  function findPid(name) {
    const p = participants.find(p => p.name === name);
    return p ? p.id : null;
  }

  // Matches based on CSV data
  const matches = [];
  
  // Singles match from CSV: Борис [Семенов] 16 vs Никита Курицин 21
  // This is one game where Nikita won 21:16
  matches.push({
    id: uuid("m"),
    groupId: "g_semenov",
    kind: "singles",
    startedAt: new Date(Date.now() - 25 * 864e5).toISOString(),
    teamA: ["p_boris"],
    teamB: ["p_nikita"],
    score: {games: [{pointsA: 16, pointsB: 21}]},
    notes: "",
    createdAt: nowIso(),
    createdByUserId: "u_maks",
  });

  // Doubles matches from CSV
  // Format: team1 [player1, player2] score1, team2 [player3, player4] score2
  // Scores are points in games (up to 21). Match is best of 3 (first to 2 wins)
  const doublesData = [
    {team1: ["Молчанов Максим", "Никита Курицин"], score1: 13, team2: ["Рома", "Юля"], score2: 21},
    {team1: ["Молчанов Максим", "Никита Курицин"], score1: 14, team2: ["Арсений", "Света"], score2: 21},
    {team1: ["Молчанов Максим", "Костя"], score1: 22, team2: ["Женя (новенький)", "Андрей"], score2: 20},
    {team1: ["Юля", "Валерий"], score1: 19, team2: ["Молчанов Максим", "Михаил"], score2: 21},
    {team1: ["Эля", "Костя"], score1: 16, team2: ["Никита Курицин", "Маша"], score2: 21},
    {team1: ["Эля", "Маша"], score1: 21, team2: ["Женя", "Молчанов Максим"], score2: 15},
    {team1: ["Михаил", "Валерий"], score1: 21, team2: ["Никита Курицин", "Молчанов Максим"], score2: 13},
    {team1: ["Ксения Буслеева", "Маша"], score1: 21, team2: ["Марина", "Света"], score2: 11},
    {team1: ["Никита Курицин", "Лиана"], score1: 9, team2: ["Света", "Арсений"], score2: 21},
    {team1: ["Света", "Лиана"], score1: 12, team2: ["Никита Курицин", "Михаил"], score2: 21},
    {team1: ["Арсений", "Никита Курицин"], score1: 15, team2: ["Рома", "Юля"], score2: 21},
    {team1: ["Ксения Буслеева", "Света"], score1: 21, team2: ["Валерий", "Женя"], score2: 18},
    {team1: ["Ксения Буслеева", "Женя"], score1: 21, team2: ["Света", "Валерий"], score2: 16},
    {team1: ["Ксения Буслеева", "Женя"], score1: 21, team2: ["Молчанов Максим", "Валерий"], score2: 8},
    {team1: ["Ксения Буслеева", "Молчанов Максим"], score1: 21, team2: ["Женя", "Света"], score2: 19},
    {team1: ["Ксения Буслеева", "Серега"], score1: 21, team2: ["Вадим", "Андрей"], score2: 14},
    {team1: ["Ксения Буслеева", "Алена"], score1: 21, team2: ["Света", "Глеб"], score2: 10},
    {team1: ["Ксения Буслеева", "Никита Курицин"], score1: 21, team2: ["Марина", "другая Света"], score2: 19},
    {team1: ["Ксения Буслеева", "Марина"], score1: 21, team2: ["Аня", "Женя"], score2: 14},
    {team1: ["Молчанов Максим", "Валерий"], score1: 16, team2: ["Арсений", "Лена"], score2: 21},
    {team1: ["Молчанов Максим", "Валерий"], score1: 21, team2: ["Арсений", "Лена"], score2: 10},
    {team1: ["Юля(с Арсением)", "Молчанов Максим"], score1: 10, team2: ["Арсений", "Юля"], score2: 21},
    {team1: ["Рома", "Юля"], score1: 21, team2: ["Молчанов Максим", "Арсений"], score2: 11},
    {team1: ["Арсений", "Молчанов Максим"], score1: 21, team2: ["Костя", "Костя(старший)"], score2: 15},
    {team1: ["Молчанов Максим", "Костя"], score1: 23, team2: ["Арсений", "Костя(старший)"], score2: 21},
    {team1: ["Михаил", "Молчанов Максим"], score1: 17, team2: ["Рома", "Костя"], score2: 21},
  ];

  // Create doubles matches
  // CSV shows final game scores (points in the last game)
  // Format: team1 [player1, player2] score1, team2 [player3, player4] score2
  // score1 and score2 are points in the final game (up to 21)
  // We create a match with the final game having these exact scores
  doublesData.forEach((data, idx) => {
    const p1a = findPid(data.team1[0]);
    const p1b = findPid(data.team1[1]);
    const p2a = findPid(data.team2[0]);
    const p2b = findPid(data.team2[1]);
    
    if (p1a && p1b && p2a && p2b) {
      const games = [];
      
      // The CSV scores represent the final game
      // Determine winner: whoever has >= 21 wins that game
      const finalGameWinner = data.score1 >= 21 ? "A" : (data.score2 >= 21 ? "B" : (data.score1 > data.score2 ? "A" : "B"));
      
      // If it's a close game (both < 21 but one is higher), it's likely a 2-1 match
      // Otherwise if one team has 21+, it might be 2-0 or 2-1
      if (finalGameWinner === "A") {
        // Team A won final game
        if (data.score1 >= 21 && data.score2 < 15) {
          // Decisive win, likely 2-0
          games.push({pointsA: 21, pointsB: Math.max(12, data.score2)});
          games.push({pointsA: data.score1, pointsB: data.score2});
        } else {
          // Close match, likely 2-1
          games.push({pointsA: Math.max(15, Math.min(19, data.score2)), pointsB: 21});
          games.push({pointsA: 21, pointsB: Math.max(15, Math.min(19, data.score1 - 2))});
          games.push({pointsA: data.score1, pointsB: data.score2});
        }
      } else {
        // Team B won final game
        if (data.score2 >= 21 && data.score1 < 15) {
          // Decisive win, likely 2-0
          games.push({pointsA: Math.max(12, data.score1), pointsB: 21});
          games.push({pointsA: data.score1, pointsB: data.score2});
        } else {
          // Close match, likely 2-1
          games.push({pointsA: 21, pointsB: Math.max(15, Math.min(19, data.score1))});
          games.push({pointsA: Math.max(15, Math.min(19, data.score2 - 2)), pointsB: 21});
          games.push({pointsA: data.score1, pointsB: data.score2});
        }
      }
      
      matches.push({
        id: uuid("m"),
        groupId: "g_semenov",
        kind: "doubles",
        startedAt: new Date(Date.now() - (doublesData.length - idx) * 864e5).toISOString(),
        teamA: [p1a, p1b],
        teamB: [p2a, p2b],
        score: {games},
        notes: "",
        createdAt: nowIso(),
        createdByUserId: "u_maks",
      });
    }
  });

  return {
    users,
    groups,
    memberships,
    participants,
    matches,
    createdAt: nowIso(),
  };
}

export function loadDb() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    // No data in localStorage - seed fresh data
    const db = seedDb();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    console.log("[mockDb] Seeded fresh database with", db.users.length, "users,", db.groups.length, "groups,", db.participants.length, "participants,", db.matches.length, "matches");
    return db;
  }
  const db = safeParse(raw, seedDb());
  // Ensure we have all required data
  if (!db.users || db.users.length === 0 || !db.groups || db.groups.length === 0) {
    console.log("[mockDb] Database corrupted or empty, reseeding...");
    const freshDb = seedDb();
    localStorage.setItem(DB_KEY, JSON.stringify(freshDb));
    return freshDb;
  }
  console.log("[mockDb] Loaded database:", db.users.length, "users,", db.groups.length, "groups,", db.participants.length, "participants,", db.matches.length, "matches");
  return db;
}

export function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function getCurrentUser(db) {
  const id = getLoggedInUserId();
  if (!id) return null;
  return db.users.find(u => u.id === id) || null;
}

export function getMyRole(db, groupId) {
  const u = getCurrentUser(db);
  if (!u) return null;
  const m = db.memberships.find(x => x.groupId === groupId && x.userId === u.id);
  return m ? m.role : null;
}

export function ensureMembership(db, groupId, role = "member") {
  const u = getCurrentUser(db);
  if (!u) throw new Error("Unauthorized");
  const exists = db.memberships.some(x => x.groupId === groupId && x.userId === u.id);
  if (!exists) db.memberships.push({groupId, userId: u.id, role});
}

export {uuid, nowIso};


