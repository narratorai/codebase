from core.util.opentelemetry import tracer
from core.v4.dataset_comp.integrations.processors.clearfind_emailer import SoftwareEmailer
from core.v4.dataset_comp.integrations.processors.clearfind_loader import LoadSoftware
from core.v4.dataset_comp.integrations.processors.clearfind_opportunity import FindOverlapSoftware
from core.v4.dataset_comp.integrations.processors.clearfind_refine import RefineSoftware
from core.v4.dataset_comp.integrations.processors.create_view import CreateView
from core.v4.dataset_comp.integrations.processors.finserve_track import TrackFinancial
from core.v4.dataset_comp.integrations.processors.materialize_view import MaterializeView
from core.v4.dataset_comp.integrations.processors.send_alert import SendAlert
from core.v4.dataset_comp.integrations.processors.send_csv import SendCSV
from core.v4.dataset_comp.integrations.processors.send_klaviyo import SendKlaviyo
from core.v4.dataset_comp.integrations.processors.send_postmark import SendPostmark
from core.v4.dataset_comp.integrations.processors.send_text import SendText
from core.v4.dataset_comp.integrations.processors.send_webhook import SendWebhook
from core.v4.dataset_comp.integrations.processors.upload_to_gsheet import UploadGSheets
from core.v4.mavis import Mavis

from .model import Materialization, MaterializationTypeEnum

TYPEMAPPING = {
    MaterializationTypeEnum.materialized_view: MaterializeView,
    MaterializationTypeEnum.alert: SendAlert,
    MaterializationTypeEnum.text: SendText,
    MaterializationTypeEnum.webhook: SendWebhook,
    MaterializationTypeEnum.postmark: SendPostmark,
    MaterializationTypeEnum.klaviyo: SendKlaviyo,
    MaterializationTypeEnum.gsheets: UploadGSheets,
    MaterializationTypeEnum.view: CreateView,
    MaterializationTypeEnum.csv: SendCSV,
    MaterializationTypeEnum.finserve_income_tracking: TrackFinancial,
    MaterializationTypeEnum.clearfind_loader: LoadSoftware,
    MaterializationTypeEnum.clearfind_refine: RefineSoftware,
    MaterializationTypeEnum.clearfind_overlap: FindOverlapSoftware,
    MaterializationTypeEnum.clearfind_evaluate_software: SoftwareEmailer,
    MaterializationTypeEnum.clearfind_email_replier: SoftwareEmailer,
}


def get_proccessor(mat: Materialization):
    return TYPEMAPPING[mat.type]


@tracer.start_as_current_span("run_materialization")
def run_materialization(mavis: Mavis, materialization: Materialization, id: str = None):
    # get the dataset
    get_proccessor(materialization)(mavis, materialization).run()
