from pydantic import BaseModel

mavis_config_path = ["run_transformation", "config.json"]


class MavisConfig(BaseModel):
    delete_prefix: str | None = None
    refund_prefix: str | None = None
    max_inserts: int = 5000000
    mutable_update_window: int = 15
    update_wlm_count: int | None = None
    use_temporary_tables: bool = False
    index_warehouse_count: int = 100
    reconcile_hours: int = 25
    last_activity_count_at: str = "1900-01-01"
    validation_days: int = 90

    class Config:
        validate_all = True
        validate_assignment = True
