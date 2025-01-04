import re

import numpy as np
from asteval import Interpreter, make_symbol_table

from core import utils
from core.errors import AnalysisInputError, FieldProcessingError
from core.models.ids import get_uuid
from core.v4.narrative.constants import MAVIS_FUNCTIONS, SORTED_FUNC, SUPPORTED_WORDS


def is_error(val):
    if isinstance(val, str):
        return "mavis-error" in val or "FAILED:" in val
    elif isinstance(val, list):
        return any(is_error(a) for a in val)
    else:
        return False


def find_parens(s, sort_data=True, error=False, parens=("(", ")")):
    toret = {}
    pstack = []

    for i, c in enumerate(s):
        if c == parens[0]:
            pstack.append(i)
        elif c == parens[1]:
            if len(pstack) == 0:
                if error:
                    raise ValueError(f"No matching closing parens at: {i}")
            else:
                toret[pstack.pop()] = i

    if len(pstack) > 0 and error:
        raise ValueError("No matching opening parens at: " + str(pstack.pop()))

    if sort_data:
        return [(k, toret[k]) for k in sorted(toret)]
    else:
        return toret


def create_aeval(fields):
    # Build up initial symbols from fields
    field_syms = {}
    for f, v in fields.items():
        if not f.startswith("__"):
            field_syms[f.replace("#", "pretty")] = v

    syms = make_symbol_table(use_numpy=False, **field_syms)

    # Cleanup syms before initializing the interpreter with it
    # Ensure evaled code cannot read from disk
    # see bottom of http://newville.github.io/asteval/motivation.html#how-safe-is-asteval
    del syms["open"]

    # Initialize a locked-down interpreter with many language features disabled
    aeval = Interpreter(
        symtable=syms,
        builtins_readonly=True,
        use_numpy=False,
        no_if=False,
        no_for=False,
        no_while=True,
        no_try=True,
        no_functiondef=True,
        no_ifexp=False,
        no_listcomp=False,  # allowing '\n'.join(..)
        no_augassign=True,
        no_assert=True,
        no_delete=True,
        no_raise=True,
        no_print=True,
    )
    return aeval


def _apply_br_change(text):
    pieces = text.split("\n")

    enters_in_row = 0
    in_quotes = False
    for ii, p in enumerate(pieces):
        if "```" in p:
            enters_in_row = 0
            in_quotes = not in_quotes

        # remove the quotes
        if not in_quotes:
            if p == "":
                enters_in_row += 1
            elif "<br>" in p.lower():
                enters_in_row = 0
            elif enters_in_row >= 3:
                pieces[ii - 2] = "\n" + ("<br>" * (enters_in_row - 2))
                enters_in_row = 0
            else:
                enters_in_row = 0
    return "\n".join(pieces)


def fill_in_template(
    analysis: dict | list | str,
    fields: dict,
    aeval: Interpreter | None = None,
    ignore_conditions: bool = False,
    replace_error: bool = True,
    mavis=None,
):
    if aeval is None:
        aeval = create_aeval(fields)

    # recursively fill in the template
    if isinstance(analysis, dict) and analysis is not None:
        if (
            not ignore_conditions
            and analysis.get("conditioned_on")
            and not fill_in_template(
                analysis["conditioned_on"].strip(),
                fields,
                aeval,
                ignore_conditions,
                replace_error,
                mavis,
            )
        ):
            return None

        # process the markdown
        if analysis.get("type") == "markdown":
            analysis["text"] = _apply_br_change(analysis.get("text") or "")

        temp_obj = {}
        # loop through  the object
        for k, item in analysis.items():
            # ignore json blobs
            if "_json" in k:
                temp_obj[k] = item
            else:
                temp_res = fill_in_template(item, fields, aeval, ignore_conditions, replace_error, mavis)

                # add if there is data
                if temp_res is not None or item is None:
                    temp_obj[k] = temp_res

        return temp_obj

    elif isinstance(analysis, list) and len(analysis) > 0:
        temp_obj = []

        is_break_on = not ignore_conditions and isinstance(analysis[0], dict) and "break_on" in analysis[0].keys()

        for item in analysis:
            temp_res = fill_in_template(item, fields, aeval, ignore_conditions, replace_error, mavis)

            # add if there is data
            if temp_res is not None:
                temp_obj.append(temp_res)

            # break if this is exits
            if is_break_on and fields.get(item.get("break_on")):
                return temp_res

        # return the main object
        if is_break_on:
            return temp_res
        else:
            return temp_obj

    elif isinstance(analysis, str):
        # Remove the comments and rstrip the text (trailing spaces should be ignored)
        # this is mainly for conditions

        # fill in the data
        try:
            # deal with the values
            val = process_text_fields(analysis, aeval, replace_error=replace_error, mavis=mavis)
        except Exception as e:
            # TODO: portal should know how to format this error message
            raise AnalysisInputError(
                f"""<div class="mavis-error" style="color:red;font-weight:bold">Failed to process data with error {e}</div>\n\n{analysis}"""
            ) from e

        return val
    else:
        return analysis


def process_text_fields(text, aeval, replace_error=True, mavis=None):
    new_text = text
    parens = find_parens(text, parens=("{", "}"))
    last_paren_close = 0
    for _ii, p in enumerate(parens):
        # ignore \ or if it is in between
        if text[p[0] - 1] == "\\" or p[0] < last_paren_close:
            continue
        # replace the # to make it work
        new_f = text[p[0] : p[1] + 1]

        try:
            compiled_val = _aeval_func(
                new_f[1:-1].replace("#", "pretty"),
                aeval,
                raise_on_error=not replace_error,
                mavis=mavis,
            )

            # if it just the value than return the value so it doesn't have to try and parse the text
            if (
                p[0] == 0
                and p[1] == (len(text) - 1)
                and not isinstance(compiled_val, bool)
                and not isinstance(compiled_val, np.bool_)
            ):
                return compiled_val

            new_text = new_text.replace(
                new_f,
                str(compiled_val),
            )
        except FieldProcessingError:
            pass

        last_paren_close = p[1]

    if parens:
        new_text = utils.string_to_value(new_text)
    return new_text


def _aeval_func(text, aeval, raise_on_error=False, mavis=None, handles_error=False):
    """
    This is clean way to use util functions
    """
    # keep looping until all the functions we have supported and done
    func_ii = 0
    handles_error = handles_error or ("is_error(" in text.lower()) or ("'failed'" in text.lower())

    while func_ii < len(SORTED_FUNC):
        f = SORTED_FUNC[func_ii]["label"][:-1]
        idx = text.find(f)
        if idx != -1:
            parens = find_parens(text[idx:])
            if len(parens) > 0:
                f_inputs = _aeval_func(
                    text[idx + parens[0][0] : idx + parens[0][1] + 1],
                    aeval,
                    mavis=mavis,
                    handles_error=handles_error,
                )

                # cascade non-managed errors
                if not handles_error and is_error(f_inputs):
                    return f_inputs

                # replace the text with the function output
                random_key = "a" + get_uuid()
                if f in MAVIS_FUNCTIONS and mavis:
                    c_func = getattr(mavis, f)

                else:
                    c_func = getattr(utils, f)

                # handle the error so it is clear where the issue is
                try:
                    temp_val = c_func(*f_inputs) if isinstance(f_inputs, tuple) else c_func(f_inputs)
                except Exception as e:
                    if raise_on_error:
                        raise FieldProcessingError(f"Could not process the field: error (str({e}))") from e
                    else:
                        temp_val = f"""<div class="mavis-error" style="color:red;font-weight:bold">ERROR:{e}</div>"""

                aeval.symtable[random_key] = temp_val

                text = text.replace(text[idx : idx + parens[0][1] + 1], random_key)
                func_ii -= 1

        # keep adding it
        func_ii += 1

    val = aeval(text.strip().replace("\n", " "))

    if val is None and len(aeval.error) > 0:
        exception_name = aeval.error[0].get_error()[0]

        # Have divide by 0 return 0 cause that is often what we want
        if exception_name == "ZeroDivisionError":
            return 0

        # better handle the error
        aeval.error = []
        if raise_on_error:
            raise FieldProcessingError("Could not process the field")
        else:
            return f"""<div class="mavis-error" style="color:red;font-weight:bold">ERROR:{aeval.error_msg}</div>"""
    else:
        return val


def find_field_variables(text):
    variables = []
    parens = utils.find_parens(text, parens=("{", "}"))

    for f in parens:
        # check if it is a dict and not a field
        if ":" in text[f[0] : f[1] + 1]:
            aeval = create_aeval({})
            evaled_value = aeval(text[f[0] : f[1] + 1])
            if isinstance(evaled_value, dict):
                continue

        words = re.findall(r"[a-zA-Z0-9_]+", text[f[0] + 1 : f[1]])
        variables.extend([w for w in words if w not in SUPPORTED_WORDS])

    return variables


def get_required_fields(analysis, names=None):
    return [rf for rf in utils.recursive_apply(analysis, find_field_variables) if names is None or rf in names.keys()]
