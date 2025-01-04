from core.v4.blocks.shared_ui_elements import (
    _basic_field_block,
    _clean_name,
    _create_autocomplete,
    _create_content,
    _get_config,
    _input,
    _make_ui,
)
from core.v4.mavis import Mavis
from core.v4.narrative.helpers import fill_in_template, get_required_fields

TITLE = "Equation"
DESCRIPTION = ""
VERSION = 1

HELPFUL_TIPS = "\n\n".join(
    [
        "Variables can be defined as any text or number by simply writing the value into the definition: ex. `4` or `hi`",
        "You can also write full python by placing the code in `{}`",
        " - Do some math: {3+4}",
        " - Use equations or other variables `{date_add(last_month, 'month', 4)}`",
        "",
        "> 💡 If you start typing in `{ ... }` each function will open documentation to help show you how it is used and hitting `tab` will auto fill in the values",
        "",
        # Table manipulation
        "<details><summary>Some helpful Table Manipulation</summary>",
        "Assume the table is `some_table`, and it has `col_1`, `col_2`",
        " - Get a value from  a table:"
        "   **eq.:** `{filter(table, 'col_1', 3, 'col2')}`"
        "   **translation:** filter the table where col_1 == 3 and return the value of col_2",
        " - Give me the first value greater than 10: `first_value(`greater_than(some_table_col_1, 10))` --> finds all th evalues greater than 10 then returns the first value (order is based on the order of the dataset)",
        " - Just give me 5 rows of the table, but only col_1 and make it pretty: `hf(select_columns(limit_table(table, 5), 'col_1')`",
        " - Give me the maximum LTV for product X: `max_values(filter_table(table, 'col_1', 'TEST', 'col_2'))`",
        "</details>",
        "",
        "<br>" "",
        "*Start typing and you will see the variables*",
        "",
        "<details><summary>Allowing users to edit</summary>",
        "1. Create a Dataset with the list of people that you want (if type is dynamic)",
        "2. Add a table to the variables in this Narrative",
        "3. Come back here and you will be able to choose the column to use as the dynamic_input",
        "4. Once you run this Narrative, you will be able to use this variable in every dataset used in here.",
        "<br>",
        "_Now you can write this entire narrative with this variable and we will automatically change it and when the Narrative loads and the user changes the drop down.  We did it this way to allow you to have control over the options in the Narrative while having a plesent edit experience_",
        "</details>",
    ]
)


def get_schema(mavis: Mavis, internal_cache: dict):
    autocomplete = internal_cache["autocomplete"] or []

    main_obj = dict(variable=_input("Definition"))
    main_ui = dict(
        variable=_make_ui(
            widget="MarkdownWidget",
            options=dict(autocomplete=autocomplete, default_height=100),
        )
    )
    override_content = _create_content("You will see a preview here once you click `Run`", HELPFUL_TIPS)

    (schema, schema_ui) = _basic_field_block(
        main_obj,
        main_ui,
        override_content=override_content,
        make_dynamic=True,
        fields=internal_cache["fields"],
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    if not internal["autocomplete"]:
        internal["autocomplete"] = _create_autocomplete(mavis, data["_raw_fields"])

    if not internal["fields"]:
        internal["fields"] = data["_raw_fields"]
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    # begin defining a new way of doing fields
    # there is no left if it is being loaded
    (config, data) = _get_config(data, "simple_variable")

    if update_field_slug in (None, "root_right_run"):
        config["name"] = name = _clean_name(config["name"] or "new variable", data["_raw_fields"])

        var = convert_to_fields(mavis, config, data["_raw_fields"])

        if var:
            # create the value
            lines = [
                "You can call the variable with `{name}` or `#{name}` if you want a pretty display",
                f"Value: {var['#'+name]} ({var[name]})",
            ]

            if config["set_as_user_input"] and config["dynamic_type"] in (
                "table_variable",
                "table_variable_multi",
            ):
                lines.extend(
                    [
                        "<br>",
                        "**The user will be able to input a value that will replace this field and then resassemble.**",
                    ]
                )

                if config["dynamic_type"] in ("table_variable", "table_variable_multi"):
                    values = fill_in_template(
                        config["dynamic_options"],
                        data["_raw_fields"],
                        mavis=mavis,
                    )
                    lines.append(f"Some example of the options ({len(values)}) the user will see are:")
                    lines.extend([f" - {v}" for v in values[:10]])

            preview = "\n\n".join(lines)
        else:
            preview = "..run to see preview "

        # TODO: change the tips to be based on the kind
        data["right"]["content"] = _create_content(preview, HELPFUL_TIPS)

        # get all the fields that this variable users
        if data["_raw_fields"]:
            config["field_depends_on"] = [
                r for r in list(set(get_required_fields(config))) if r in data["_raw_fields"].keys() and r != name
            ]

    # add the config back
    data["left"] = config
    return data


def run_data(mavis: Mavis, data: dict):
    # fixed the data
    return [dict(type="json", value=data["left"])]


def convert_to_fields(mavis: Mavis, config, fields, cache_minutes=None, local_cache=None, aeval=None):
    if config["name"] and config.get("value"):
        config = fill_in_template(config, fields, mavis=mavis, aeval=aeval)
        name = _clean_name(config["name"], fields)
        return {
            f"{name}": config["value"].get("variable"),
            f"#{name}": mavis.human_format(config["value"].get("variable"), config["format"]),
            f"__{name}": config.get("explanation") or "",
        }
    else:
        return {}
