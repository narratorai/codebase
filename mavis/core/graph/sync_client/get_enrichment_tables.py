from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_kinds_enum, transformation_update_types_enum


class GetEnrichmentTables(BaseModel):
    all_transformations: List["GetEnrichmentTablesAllTransformations"]


class GetEnrichmentTablesAllTransformations(BaseModel):
    id: Any
    name: Optional[str]
    kind: Optional[transformation_kinds_enum]
    slug: str
    update_type: Optional[transformation_update_types_enum]
    table: Optional[str]
    task_id: Optional[Any]
    column_renames: List["GetEnrichmentTablesAllTransformationsColumnRenames"]
    production_queries: List["GetEnrichmentTablesAllTransformationsProductionQueries"]
    production_queries_aggregate: "GetEnrichmentTablesAllTransformationsProductionQueriesAggregate"


class GetEnrichmentTablesAllTransformationsColumnRenames(BaseModel):
    name: Optional[str]
    type: Optional[str]
    label: Optional[str]
    casting: Optional[str]
    id: Optional[Any]


class GetEnrichmentTablesAllTransformationsProductionQueries(BaseModel):
    sql: Optional[str]
    updated_by: Optional[str]


class GetEnrichmentTablesAllTransformationsProductionQueriesAggregate(BaseModel):
    aggregate: Optional["GetEnrichmentTablesAllTransformationsProductionQueriesAggregateAggregate"]


class GetEnrichmentTablesAllTransformationsProductionQueriesAggregateAggregate(BaseModel):
    count: int


GetEnrichmentTables.update_forward_refs()
GetEnrichmentTablesAllTransformations.update_forward_refs()
GetEnrichmentTablesAllTransformationsColumnRenames.update_forward_refs()
GetEnrichmentTablesAllTransformationsProductionQueries.update_forward_refs()
GetEnrichmentTablesAllTransformationsProductionQueriesAggregate.update_forward_refs()
GetEnrichmentTablesAllTransformationsProductionQueriesAggregateAggregate.update_forward_refs()
