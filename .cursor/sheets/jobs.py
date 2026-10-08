#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

SHEET_ID = "1BLKph0W2yLeEnc-3L9JCnQBGcufENGjcEUTDBPpCovo"
HERE = Path(__file__).resolve().parent
SA_PATH = HERE / "service-account.json"
SCOPES = (
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
)
TAB = "Лист1"
RANGE_ALL = f"'{TAB}'!A:H"
HEADER = [
    "компания",
    "страна",
    "вакансия",
    "ссылка",
    "канал",
    "дата",
    "результат",
    "заметки",
]
SA_EMAIL = "sheets-mechanics@halogen-antenna-435712-f7.iam.gserviceaccount.com"


def _service():
    if not SA_PATH.is_file():
        sys.exit(
            f"Нет {SA_PATH}\n"
            "Один раз: Google Cloud → сервис-аккаунт → ключ JSON → "
            "файл сюда, и шару таблицы на email из JSON (client_email)."
        )
    creds = service_account.Credentials.from_service_account_file(SA_PATH, scopes=SCOPES)
    return build("sheets", "v4", credentials=creds, cache_discovery=False)


def _api():
    return _service().spreadsheets()


def get_values() -> list[list[str]]:
    out = _api().values().get(spreadsheetId=SHEET_ID, range=RANGE_ALL).execute()
    return out.get("values") or []


def write_values(rows: list[list[str]]) -> None:
    _api().values().clear(spreadsheetId=SHEET_ID, range=RANGE_ALL).execute()
    _api().values().update(
        spreadsheetId=SHEET_ID,
        range=RANGE_ALL,
        valueInputOption="USER_ENTERED",
        body={"range": RANGE_ALL, "majorDimension": "ROWS", "values": rows},
    ).execute()


def update_row(row_1based: int, values: list[str]) -> None:
    end_col = chr(ord("A") + len(values) - 1)
    rng = f"'{TAB}'!A{row_1based}:{end_col}{row_1based}"
    _api().values().update(
        spreadsheetId=SHEET_ID,
        range=rng,
        valueInputOption="USER_ENTERED",
        body={"range": rng, "majorDimension": "ROWS", "values": [values]},
    ).execute()


def patch_cells(updates: dict[str, str]) -> None:
    data = [{"range": f"'{TAB}'!{cell}", "values": [[val]]} for cell, val in updates.items()]
    _api().values().batchUpdate(
        spreadsheetId=SHEET_ID,
        body={"valueInputOption": "USER_ENTERED", "data": data},
    ).execute()


def cmd_get() -> None:
    json.dump(get_values(), sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


def cmd_summary() -> None:
    rows = get_values()
    if not rows:
        print("empty")
        return
    body = rows[1:] if rows and rows[0][:1] == ["компания"] or (rows and "компани" in str(rows[0][0]).lower()) else rows
    if rows and len(rows[0]) >= 7 and "результат" in "".join(rows[0]).lower():
        body = rows[1:]
    statuses = Counter()
    talking = []
    for i, r in enumerate(body, start=2):
        while len(r) < 8:
            r.append("")
        company, country, vacancy, link, channel, date, status, notes = r[:8]
        statuses[status or "(пусто)"] += 1
        if status in ("в процессе переписки/общения",) or "YLAB" in company.upper() or "ylab" in notes.lower():
            talking.append(
                {
                    "row": i,
                    "company": company,
                    "country": country,
                    "vacancy": vacancy,
                    "status": status,
                    "notes": notes[:200],
                    "date": date,
                    "channel": channel,
                }
            )
    print(json.dumps({"total": len(body), "by_status": dict(statuses), "hot": talking}, ensure_ascii=False, indent=2))


def cmd_write() -> None:
    rows = json.load(sys.stdin)
    if not rows or rows[0] != HEADER:
        rows = [HEADER, *rows]
    write_values(rows)
    print(f"ok write {len(rows) - 1} rows")


def cmd_patch() -> None:
    updates = json.load(sys.stdin)
    if not isinstance(updates, dict) or not updates:
        sys.exit('stdin: JSON-объект {"G12": "статус", "H12": "заметка"}')
    patch_cells({str(k): str(v) for k, v in updates.items()})
    print(f"ok patch {len(updates)} cells")


def cmd_whoami() -> None:
    print(SA_EMAIL)


def cmd_fix_funnel() -> None:
    funnel = [
        ["Воронка", "", ""],
        ["оффер", '=COUNTIF(G:G;"оффер")', '=IF($K$10=0;"";K2/$K$10)'],
        [
            "позвали на собеседование",
            '=COUNTIF(G:G;"позвали на собеседование")',
            '=IF($K$10=0;"";K3/$K$10)',
        ],
        [
            "в процессе переписки/общения",
            '=COUNTIF(G:G;"в процессе переписки/общения")',
            '=IF($K$10=0;"";K4/$K$10)',
        ],
        [
            "отправил резюме/сообщение/письмо!",
            '=COUNTIF(G:G;"отправил резюме/сообщение/письмо!")',
            '=IF($K$10=0;"";K5/$K$10)',
        ],
        [
            "отрицательный ответ",
            '=COUNTIF(G:G;"отрицательный ответ")',
            '=IF($K$10=0;"";K6/$K$10)',
        ],
        [
            "Вакансия в архиве!",
            '=COUNTIF(G:G;"Вакансия в архиве!")',
            '=IF($K$10=0;"";K7/$K$10)',
        ],
        [
            "нужен ручной отклик",
            '=COUNTIF(G:G;"нужен ручной отклик")',
            '=IF($K$10=0;"";K8/$K$10)',
        ],
        [
            "(без статуса)",
            '=COUNTIFS(A2:A2000;"<>";G2:G2000;"")',
            '=IF($K$10=0;"";K9/$K$10)',
        ],
        ["всего (G)", "=COUNTA(A2:A2000)", ""],
    ]
    _api().values().update(
        spreadsheetId=SHEET_ID,
        range=f"'{TAB}'!J1:L10",
        valueInputOption="USER_ENTERED",
        body={"values": funnel},
    ).execute()
    meta = _api().get(spreadsheetId=SHEET_ID, fields="sheets.properties").execute()
    sheet_id = meta["sheets"][0]["properties"]["sheetId"]
    _api().batchUpdate(
        spreadsheetId=SHEET_ID,
        body={
            "requests": [
                {
                    "repeatCell": {
                        "range": {
                            "sheetId": sheet_id,
                            "startRowIndex": 1,
                            "endRowIndex": 9,
                            "startColumnIndex": 11,
                            "endColumnIndex": 12,
                        },
                        "cell": {
                            "userEnteredFormat": {
                                "numberFormat": {"type": "PERCENT", "pattern": "0%"}
                            }
                        },
                        "fields": "userEnteredFormat.numberFormat",
                    }
                }
            ]
        },
    ).execute()
    print("ok fix_funnel")


def main() -> None:
    cmds = {
        "get": cmd_get,
        "summary": cmd_summary,
        "write": cmd_write,
        "patch": cmd_patch,
        "whoami": cmd_whoami,
        "fix_funnel": cmd_fix_funnel,
    }
    if len(sys.argv) != 2 or sys.argv[1] not in cmds:
        sys.exit("usage: jobs.py get|summary|write|patch|whoami|fix_funnel")
    try:
        cmds[sys.argv[1]]()
    except Exception as e:
        msg = str(e)
        if "403" in msg or "permission" in msg.lower():
            sys.exit(
                f"Нет доступа к таблице «Работа».\n"
                f"Пошарь её на {SA_EMAIL} как Редактор:\n"
                f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit\n"
                f"→ Поделиться → вставь email → Редактор → Готово.\n"
                f"Детали: {e}"
            )
        raise


if __name__ == "__main__":
    main()
