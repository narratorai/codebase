from core.decorators import with_mavis
from core.logger import get_logger
from core.util.tracking import fivetran_track
from core.v4.mavis import Mavis

logger = get_logger()


def track_company(mavis: Mavis):
    company_fivetran_url = "https://webhooks.fivetran.com/webhooks/30fca683-0f1c-480a-9640-3128d0a65e31"
    file_path = "/Users/ahmedelsamadisi/Downloads/"
    file = "2024 Q2 Financial Data/sub.txt"

    with open(file_path + file) as f:
        first_line = next(f)[:-1].split("\t")  # Skip the first line
        for line in f:
            values = line[:-1].split("\t")
            res = {k: values[ii] for ii, k in enumerate(first_line)}
            res["code_version"] = 1
            fivetran_track(mavis.company.current_user, mavis.company, company_fivetran_url, res)


@with_mavis
def finserv_track_stocks(mavis: Mavis, company_slug=None):
    track_company(mavis)

    # API and collect the data
