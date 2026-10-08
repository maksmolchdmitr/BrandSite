# create-card — glance

Ты даёшь только **key** (или список через запятую/строками). Агент сам пишет value, example, description и добавляет карточку.

| Ты | Агент |
|----|-------|
| `sought` | перевод, пример, описание → CSV + коробка 0 |
| `seek, sought, seeking` | по одной карточке на каждый key |
| `RV` | ключ как дан — аббревиатуры **капсом**, без forced lowercase |

**Команда после генерации:**
```bash
cd leitner-vocab && ./scripts/add-card.sh "<key>" "<value>" "<example>" "<description>"
```

**Проверка:** http://localhost:8087/card.html?key=KEY
