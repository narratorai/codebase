import json
import random

import backoff
import boto3
import gspread
from cachetools import TTLCache, cached
from gspread.exceptions import WorksheetNotFound
from oauth2client import service_account

from core.errors import GsheetAuthenticationError
from core.logger import get_logger
from core.util.opentelemetry import tracer

TOTAL_GSHEET_CRED = 20
logger = get_logger()


@cached(cache=TTLCache(maxsize=TOTAL_GSHEET_CRED + 1, ttl=1_209_000))
def get_google_crendentials(ii=0):
    """
    Returns the Google services credentials for accessing Google sheets.
    """
    idx = ii % TOTAL_GSHEET_CRED
    s3 = boto3.resource("s3")
    body = s3.Bucket("narratorai-keys").Object(f"gsheet{idx}.json").get()["Body"].read()
    gservice_dict = json.loads(body.decode("utf-8"))

    credentials_factory = service_account.ServiceAccountCredentials.from_json_keyfile_dict(gservice_dict)
    scopes = ["https://spreadsheets.google.com/feeds"]

    return credentials_factory.create_scoped(scopes)


@tracer.start_as_current_span("get_google_client")
def get_google_client():
    """
    Returns the Google services client for accessing Google sheets.
    """
    credentials = get_google_crendentials(
        random.randint(0, TOTAL_GSHEET_CRED - 1)  # noqa: S311
    )
    try:
        return gspread.authorize(credentials)
    except Exception as e:
        if "PERMISSION_DENIED" in str(e):
            raise GsheetAuthenticationError() from e


@backoff.on_exception(backoff.constant, Exception, max_tries=3)
@tracer.start_as_current_span("o")
def get_google_sheet(sheet_key, worksheet_name):
    """
    Returns the Google sheet and worksheet.
    """
    google_client = get_google_client()
    doc = google_client.open_by_key(sheet_key)

    try:
        ws = doc.worksheet(worksheet_name)
    except WorksheetNotFound:
        ws = doc.add_worksheet(title=worksheet_name, rows=100, cols=100)
    return ws


@backoff.on_exception(backoff.constant, Exception, max_tries=5)
@tracer.start_as_current_span("update_sheet")
def update_sheet(ws, rows, start_ii: int = 0):
    if rows:
        logger.debug("updating the google sheet")
        col_len = len(rows[0])
        # try and update
        ws.update(
            f"A{start_ii + 1}:{row_to_address(col_len)}{start_ii + len(rows)+1 }",
            rows,
        )


def row_to_address(num: int):
    if num < 26:
        return chr(65 + num)
    else:
        return f"{row_to_address(int(num / 25) - 1)}{row_to_address(max(0, num % 25 - 1))}"
