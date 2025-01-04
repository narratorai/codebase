from fastapi import APIRouter, Depends

from core import utils
from core.api.auth import get_mavis
from core.errors import SilenceError
from core.graph import graph_client
from core.logger import get_logger
from core.v4.mavis import Mavis

from .helpers import get_customer_journey, get_visual_customer_journey
from .models import (
    DEFAULT_CUSTOMER_KIND,
    AutoCompleteResults,
    CustomerJourneyResults,
    CustomerKinds,
    CustomerStreamInput,
)

router = APIRouter(prefix="/customer_journey", tags=["customer journey"])
logger = get_logger()


@router.get("/attributes", response_model=CustomerJourneyResults)
async def fetch_customer_attributes(
    dim_table_id: str,
    customer: str,
    run_live: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    dim = graph_client.get_dim(id=dim_table_id).dim_table_by_pk
    if dim is None:
        raise SilenceError("No customer table", http_status_code=404)

    qm = mavis.qm
    company = mavis.company

    query = qm.Query()
    query.add_column(qm.Column(table_alias="c", all_columns=True))
    query.set_from(qm.Table(schema=dim.schema_, table=dim.table, alias="c"))
    query.set_where(
        qm.Condition(
            operator="equal",
            left=qm.Column(table_alias="c", table_column="customer"),
            right=qm.Column(value=customer),
        )
    )
    data = mavis.run_query(query.to_query(), within_minutes=0 if run_live else company.cache_minutes)

    # remove the built in columns
    temp_columns = [c.field for c in data.columns if not c.field.startswith("_")]
    if len(temp_columns) != len(data.columns):
        data.rows = utils.filter_dict(data.rows, temp_columns)

    return dict(data=data.to_old())


@router.get("/autocomplete", response_model=AutoCompleteResults)
async def get_customer_autocomplete(
    dim_table_id: str,
    customer_part: str,
    customer_kind: str | None = "customer",
    run_live: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    if customer_kind in DEFAULT_CUSTOMER_KIND:
        customer_kind = None

    # add a default table
    dim = graph_client.get_dim(id=dim_table_id).dim_table_by_pk
    if dim is None:
        raise SilenceError("No customer table", http_status_code=404)

    qm = mavis.qm
    query = qm.Query()
    query.add_column(qm.Column(table_alias="c", table_column=customer_kind or dim.join_key))
    query.set_from(qm.Table(schema=dim.schema_, table=dim.table, alias="c"))

    # getting the col
    is_str = True
    if customer_kind:
        dim_col = next((c for c in dim.columns if c.name == customer_kind), None)

        if dim_col is None:
            raise ValueError(f"Column {customer_kind} not found in {dim.table}")

        is_str = utils.same_types(dim_col.type, "string")

    filters = []
    # all for multiple filters
    for v in customer_part.split("%"):
        filters.extend(
            [
                qm.Condition(
                    operator="contains" if is_str else "equal",
                    left=qm.Column(table_alias="c", table_column=dim.join_key),
                    right=qm.Column(value=v),
                ),
                "AND",
            ]
        )

    query.set_where(qm.Filter(filters=filters[:-1]))
    query.set_limit(25)

    # run the data
    data = mavis.run_query(query.to_query(), within_minutes=0 if run_live else 100_000)

    return dict(customers=utils.get_column_values(data, dim.join_key, skip_null=True))


@router.get("/customer_kind", response_model=list[CustomerKinds])
async def get_customer_kind(dim_table_id: str, mavis: Mavis = Depends(get_mavis)):
    customer_kinds = [
        dict(id="customer", name="Customer"),
        dict(id="join_customer", name="Identified or Anonymous"),
        dict(id="anonymous_customer_id", name="Anonymous ID"),
    ]
    table = graph_client.get_dim(id=dim_table_id).dim_table_by_pk

    # return the proper kinds
    for c in table.columns:
        if utils.get_simple_type(c.type) in ("string", "number"):
            customer_kinds.append(dict(id=c.column, name=c.label))

    return customer_kinds


@router.post("/stream", response_model=CustomerJourneyResults)
async def fetch_customer_stream(
    input: CustomerStreamInput,
    run_live: bool = False,
    as_visual: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    input.run_live = run_live
    if as_visual:
        return get_visual_customer_journey(mavis, input)
    else:
        return get_customer_journey(mavis, input)
