#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

SHEET_ID = "1pGYNocr8dE1Q9rNGNfXP8OIQdYvKo55ViKrqGSaW3wI"
HERE = Path(__file__).resolve().parent
SA_PATH = HERE / "service-account.json"
SCOPES = (
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
)
TAB = "Механики"
RANGE_ALL = f"'{TAB}'!A:G"
HEADER = ["№", "Механика", "Как работает", "Пример", "Сложность", "Почему вау", "Комбо"]
COL_WIDTHS = [52, 160, 420, 160, 100, 260, 90]


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
    _api().values().update(
        spreadsheetId=SHEET_ID,
        range=RANGE_ALL,
        valueInputOption="USER_ENTERED",
        body={"range": RANGE_ALL, "majorDimension": "ROWS", "values": rows},
    ).execute()
    format_sheet()


def format_sheet() -> None:
    meta = _api().get(spreadsheetId=SHEET_ID, fields="sheets.properties").execute()
    sheets = meta.get("sheets") or []
    sheet_id = next(
        (
            s["properties"]["sheetId"]
            for s in sheets
            if s.get("properties", {}).get("title") == TAB
        ),
        sheets[0]["properties"]["sheetId"],
    )
    col_reqs = [
        {
            "updateDimensionProperties": {
                "range": {
                    "sheetId": sheet_id,
                    "dimension": "COLUMNS",
                    "startIndex": i,
                    "endIndex": i + 1,
                },
                "properties": {"pixelSize": px},
                "fields": "pixelSize",
            }
        }
        for i, px in enumerate(COL_WIDTHS)
    ]
    _api().batchUpdate(
        spreadsheetId=SHEET_ID,
        body={
            "requests": [
                {
                    "updateSheetProperties": {
                        "properties": {
                            "sheetId": sheet_id,
                            "gridProperties": {"frozenRowCount": 1},
                        },
                        "fields": "gridProperties.frozenRowCount",
                    }
                },
                {
                    "repeatCell": {
                        "range": {
                            "sheetId": sheet_id,
                            "startRowIndex": 0,
                            "endRowIndex": 1,
                            "startColumnIndex": 0,
                            "endColumnIndex": 7,
                        },
                        "cell": {
                            "userEnteredFormat": {
                                "backgroundColor": {
                                    "red": 0.094,
                                    "green": 0.502,
                                    "blue": 0.220,
                                },
                                "horizontalAlignment": "CENTER",
                                "verticalAlignment": "MIDDLE",
                                "wrapStrategy": "WRAP",
                                "textFormat": {
                                    "foregroundColor": {"red": 1, "green": 1, "blue": 1},
                                    "bold": True,
                                    "fontSize": 10,
                                },
                            }
                        },
                        "fields": (
                            "userEnteredFormat(backgroundColor,horizontalAlignment,"
                            "verticalAlignment,wrapStrategy,textFormat)"
                        ),
                    }
                },
                {
                    "repeatCell": {
                        "range": {
                            "sheetId": sheet_id,
                            "startRowIndex": 1,
                            "startColumnIndex": 0,
                            "endColumnIndex": 7,
                        },
                        "cell": {
                            "userEnteredFormat": {
                                "wrapStrategy": "WRAP",
                                "verticalAlignment": "TOP",
                            }
                        },
                        "fields": (
                            "userEnteredFormat.wrapStrategy,"
                            "userEnteredFormat.verticalAlignment"
                        ),
                    }
                },
                *col_reqs,
            ]
        },
    ).execute()


def cmd_get() -> None:
    json.dump(get_values(), sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


def cmd_format() -> None:
    format_sheet()
    print("ok format")


def cmd_write() -> None:
    rows = json.load(sys.stdin)
    if not rows or rows[0] != HEADER:
        rows = [HEADER, *rows]
    write_values(rows)
    print(f"ok write {len(rows) - 1} rows")


def cmd_append() -> None:
    row = json.load(sys.stdin)
    if not isinstance(row, list) or len(row) != 7:
        sys.exit("stdin: JSON-массив из 7 ячеек")
    values = get_values()
    if not values:
        values = [HEADER]
    values.append([str(c) for c in row])
    for i in range(1, len(values)):
        values[i][0] = str(i)
    write_values(values)
    print(f"ok append №{values[-1][0]}")


def main() -> None:
    cmds = {"get": cmd_get, "format": cmd_format, "write": cmd_write, "append": cmd_append}
    if len(sys.argv) != 2 or sys.argv[1] not in cmds:
        sys.exit("usage: sheet.py get|format|write|append")
    cmds[sys.argv[1]]()


if __name__ == "__main__":
    main()
