import importlib

from core.util.tracking import fivetran_track
from core.utils import dict_to_rec_dd, rec_dd_dict
from core.v4.mavis import Mavis


class Block:
    def __init__(self, mavis: Mavis, slug, data=None, ignore_track=False):
        self.slug: str = slug
        self.mavis: Mavis = mavis
        self.ignore_track = ignore_track

        # get the module
        self.module = importlib.import_module(f"core.v4.blocks.{self.slug}")
        self.version = self.module.VERSION
        self.ADVANCED_ONLY = getattr(self.module, "ADVANCED_ONLY", False)
        self.is_async = getattr(self.module, "IS_ASYNC", False)

        self.data = dict_to_rec_dd(self.clean_data(data))

    @staticmethod
    def clean_data(data):
        if data is None:
            data = {}
        # remove data on load
        return {k: v for k, v in data.items() if not k.startswith("_") or k == "_raw_fields"}

    def get_data(self):
        return rec_dd_dict(self.data)

    def title(self):
        """Get the title for the block"""
        return dict(
            slug=self.slug,
            version=self.version,
            title=self.module.TITLE,
            description=self.module.DESCRIPTION,
            is_advanced=self.ADVANCED_ONLY,
        )

    def update_schema(self, internal_cache=None):
        if internal_cache is None and not self.ignore_track:
            fivetran_track(self.mavis.user, data=dict(action="loaded_new_block", block=self.slug))

        # keep if null
        internal_cache = dict_to_rec_dd(internal_cache or dict())
        if not isinstance(self.data, list):
            internal_cache["requester"] = self.data.get("requester")

        # take the state and get the internal data
        internal_cache = self.module.get_internal_cache(self.mavis, self.data, internal_cache)

        # get the schema based on the module
        schema, ui_schema = self.module.get_schema(self.mavis, internal_cache)

        return dict(
            schema=schema,
            ui_schema=ui_schema,
            data=self.get_data(),
            internal_cache=rec_dd_dict(internal_cache),
        )

    async def async_process_data(self, updated_field_slug=None, data=None):
        self.data = await self.module.process_data(self.mavis, data or self.data, updated_field_slug)
        return dict(
            data=self.get_data(),
            redirect_url=self.data.get("_redirect_url"),
            notification=self.data.get("_notification"),
            confetti=self.data.get("_confetti") or False,
            dirty=self.data.get("_dirty") or False,
            show_beacon_id=self.data.get("_show_beacon_id"),
        )

    def process_data(self, updated_field_slug=None, data=None):
        self.data = self.module.process_data(self.mavis, data or self.data, updated_field_slug)
        return dict(
            data=self.get_data(),
            redirect_url=self.data.get("_redirect_url"),
            notification=self.data.get("_notification"),
            confetti=self.data.get("_confetti") or False,
            dirty=self.data.get("_dirty") or False,
            show_beacon_id=self.data.get("_show_beacon_id"),
        )

    def get_values(self, updated_field_slug=None, data=None):
        self.data = self.module.get_values(self.mavis, data or self.data, updated_field_slug)
        return dict(data=self.get_data())

    def run_data(self, data=None):
        data = data or self.data
        if not self.ignore_track:
            fivetran_track(self.mavis.user, data=dict(action="ran_block", block=self.slug))
        res = self.module.run_data(self.mavis, data)
        return res


# [DEPRECATE] V0
def find_all_funcs(obj, funcs=None):
    # initialize the funcs
    if funcs is None:
        funcs = []

    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "func" and v is not None:
                funcs.append(obj)
                break

            if isinstance(v, dict):
                find_all_funcs(v, funcs)

            if isinstance(v, list):
                for ii, tv in enumerate(v):
                    if isinstance(tv, dict):
                        tv["index"] = ii
                    find_all_funcs(tv, funcs)

        return funcs
