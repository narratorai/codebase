from core.v4 import analysisGenerator

#
# !!! Security sensitive code !!!
#
# Modifying this file requires code review
#

# https://docs.python.org/3/library/functions.html
# don't include sum, min, max b/c they conflict with our prebuilt function names
BUILTIN_FUNCTIONS = [
    "abs",
    "all",
    "any",
    "dict",
    "format",
    "len",
    "list",
    "pow",
    "round",
]


def predefined_symbols(mavis):
    """
    Returns all the predefined symbols (i.e. variables) the user can use.
    This is in practice our list of predefined default fields

    examples: this_month, company_name
    """

    symbols = {}

    if mavis:
        default_fields = analysisGenerator._get_default_fields(mavis)
        for field in default_fields:
            symbols[field["name"]] = field["value"]["content"]

    for name in BUILTIN_FUNCTIONS:
        symbols[name] = __builtins__[name]

    return symbols
