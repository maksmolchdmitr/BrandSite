---
name: create-card
description: >-
  Adds vocabulary cards to leitner-vocab. User gives only key or a list of keys;
  the agent generates value, example, description and runs add-card. Use for
  /create-card or when the user asks to add word(s) to Leitner Vocab.
disable-model-invocation: true
paths: leitner-vocab/**
---

# create-card

Сначала прочитай [GLANCE.md](GLANCE.md).

## Что даёт пользователь

Только **key** — одно слово или список (`seek`, `seek, sought`, по строкам, через запятую).

**Не спрашивай** value / example / description — **сгенерируй сам**.

## Что генерируешь ты

Для каждого key:

| Поле | Правила |
|------|---------|
| **value** | Перевод на русский; несколько значений через запятую |
| **example** | Одно естественное английское предложение со словом; упоминай другие **key** из словаря где уместно — станут ссылками |
| **description** | Краткое пояснение на английском (1–2 предложения); можно ссылаться на родственные **key** |

Перед генерацией прочитай `leitner-vocab/data/english-vocabulary.csv` — стиль и уже существующие слова для перекрёстных ссылок.

## Workflow (на каждый key)

1. Нормализуй key: trim, без пробелов. **Регистр сохраняй как дал пользователь** (аббревиатуры вроде `RV` — капсом; обычные слова — как написал, не форсируй lowercase).
2. Дубликат — пропусти, сообщи пользователю; не перезаписывай.
3. Сгенерируй value, example, description.
4. Добавь:
   ```bash
   cd leitner-vocab
   ./scripts/add-card.sh "<key>" "<value>" "<example>" "<description>"
   ```
   Сервер `:8087` → API; иначе:
   ```bash
   JAVA_HOME=/opt/homebrew/Cellar/openjdk/26.0.1/libexec/openjdk.jdk/Contents/Home \
     ./gradlew -q addCard -PcardArgs="key|value|example|description"
   ```
5. В ответе — таблица: key, value (кратко), ссылка `http://localhost:8087/card.html?key=<key>`.

## Несколько key

Обрабатывай по очереди. В конце — сводка: добавлено / пропущено (дубликат) / ошибка.

## Ошибки

| Ситуация | Действие |
|----------|----------|
| key уже в CSV | Пропустить, не спрашивать «перезаписать?» |
| Gradle / Java | `JAVA_HOME` на OpenJDK 26 |
| API 4xx/5xx | Показать тело ответа |
