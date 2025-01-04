import inspect

from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.v4 import analysisGenerator
from core.v4.fields.autocomplete_definitions import ROW_AUTOCOMPLETE, VALUE_AUTOCOMPLETE
from core.v4.fields.fields_objects import Dataset, Group, Row
from core.v4.narrative.constants import MAVIS_FUNCTIONS, SUPPORTED_FUNC, SUPPORTED_WORDS

#
# !!! Security sensitive code !!!
#
# Modifying this file requires code review
#


#
# These are all the functions used in the Fields editor
# Everything exposed to the user, except for a small list of builtins, is here
#
# All the functions defined here can be called directly (and safely) in
# the python code of the fields editor
#


class AllFunctions:
    """
    An instance with all usable functions on it. All function calls the user can make
    are calls to functions directly on an instance of this class

    API
     - function_names(): get all allowed function names
     - autocomplete():   get autocomplete info for all functions
    """

    autocomplete = []

    def __init__(self, mavis, local_cache):
        self.instances = [
            self.MavisFunctions(mavis, local_cache) if mavis else None,
            self.RowFunctions(),
            self.GlobalFunctions(),
        ]
        self.all_names = [
            name for instance in self.instances if instance is not None for name in instance.function_names
        ]

    def __getattr__(self, name):
        if not name.startswith("_"):
            for instance in self.instances:
                fn = getattr(instance, name, None)
                if fn:
                    return fn

        raise AttributeError(name)

    @property
    def function_names(self):
        return self.all_names

    @staticmethod
    def autocomplete():  # noqa: F811
        return (
            AllFunctions.GlobalFunctions.autocomplete()
            + AllFunctions.RowFunctions().autocomplete()
            + VALUE_AUTOCOMPLETE
        )

    class FunctionsInstance:
        """
        quick and dirty abstract base class without importing abc
        """

        @property
        def function_names(self):
            raise NotImplementedError("subclasses must implement the function_names attribute")

        @staticmethod
        def autocomplete():
            raise NotImplementedError("subclasses must implement the autocomplete function")

    # This acts kind of like an execution context
    class MavisFunctions(FunctionsInstance):
        """
        Exposes user-facing functions that require Mavis to execute
        """

        def __init__(self, mavis, local_cache) -> None:
            self.mavis = mavis
            self.local_cache = local_cache

        # The parser rewrites `datasets.` to this function
        def get_dataset(self, slug: str) -> Dataset:
            dataset_updator = DatasetManager(mavis=self.mavis)
            dataset_id = dataset_updator._slug_to_id(slug)
            dataset_query_obj = dataset_updator.get_config(dataset_id)

            return Dataset(slug, dataset_query_obj, self)

        # Called by a Dataset object to look up a group
        def get_group(self, dataset: Dataset, group_slug: str) -> Group:
            data = analysisGenerator._get_dataset(self.mavis, dataset.slug, group_slug, True, self.local_cache)

            raw_groups = data["dataset_obj"]["all_groups"]
            group_name = next((g["name"] for g in raw_groups if g["slug"] == group_slug), None)

            if data and data["results"]:
                return Group(
                    group_slug,
                    group_name,
                    data["results"]["rows"],
                    data["results"]["columns"],
                )

            return None

        def human_format(self, *args):
            return self.mavis.human_format(*args)

        def hf(self, *args):
            return self.human_format(*args)

        @property
        def function_names(self):
            attributes = dir(self)
            return [
                attr
                for attr in attributes
                if attr != "function_names" and inspect.ismethod(getattr(self, attr)) and not attr.startswith("__")
            ]

        @staticmethod
        def autocomplete():
            # the mavis functions are special-cased or exposed elsewhere, so aren't directly autocompleted
            return []

    class RowFunctions(FunctionsInstance):
        """
        All functions available to the user that work on rows
        """

        def __init__(self):
            self.row_function_names = utils.supported_function + ["filter"]

        def __getattr__(self, name):
            """
            Returns the appropriate function to call given the name
            """
            if name in self.row_function_names:

                def wrapper(rows, column: str):
                    values = self._column_values(rows, column)
                    return utils.apply_function(name, values)

                return wrapper
            else:
                raise AttributeError(name)

        @property
        def function_names(self):
            return self.row_function_names

        @staticmethod
        def autocomplete():
            return ROW_AUTOCOMPLETE

        def filter(self, rows: list[Row], column: str, condition: str, test_value):
            """
            Filters a list of rows

            e.g. by_month.filter('month', '==', start_month)
            """
            new_rows = [r for r in rows if self._check_condition(r, column, condition, test_value)]
            return new_rows

        @staticmethod
        def _check_condition(row: list[Row], column: str, condition: str, test_value):
            value = getattr(row, column)

            if condition == ">=":
                return value >= test_value
            elif condition == ">":
                return value > test_value
            elif condition == "==":
                return value == test_value
            elif condition == "<=":
                return value <= test_value
            elif condition == "<":
                return value < test_value
            elif condition == "!=":
                return value != test_value
            elif condition == "is_null":
                return value is None
            elif condition == "is_not_null":
                return value is not None
            else:
                raise ValueError(
                    f"Not a valid condition {condition} (valid are >=, >, <=, <, ==, !=, is_null, is_not_null )"
                )

        def _column_values(self, rows: list[Row], column: str):
            """
            Given a column name and a list of rows returns the values for just that column
            """
            return [getattr(row, column) for row in rows]

    class GlobalFunctions(FunctionsInstance):
        def __init__(self):
            self.global_function_names = self._global_function_names()
            self.global_functions = self._global_functions(self.global_function_names)

        def __getattr__(self, name):
            """
            Returns the appropriate function to call given the name
            """
            if name in self.global_function_names:
                return self.global_functions[name]
            else:
                raise AttributeError(name)

        @property
        def function_names(self):
            return self.global_function_names

        @staticmethod
        def autocomplete():
            return [
                {
                    **item,
                    "label": item["label"][:-1],
                    "calledOn": "global",
                    "returns": "value",
                }
                for item in SUPPORTED_FUNC
                if item["label"] not in ["inflection(", "iff("]
            ]

        def _global_functions(self, function_names) -> dict:
            """
            Returns a dictionary of {function name: function} for global value functions
            These are things like human_format, date_diff, etc that don't operate specifically on Datasets, Groups, Rows, etc
            """
            return {name: getattr(utils, name) for name in self.function_names}

        @staticmethod
        def _global_function_names():
            # NOTE: human_format and hf are brought in through Mavis. iff not needed. inflection doesn't exist
            function_names = [name for name in SUPPORTED_WORDS if name not in MAVIS_FUNCTIONS]
            return function_names
