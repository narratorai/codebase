import pytest

from core.v4.fields.all_functions import AllFunctions
from core.v4.fields.all_symbols import predefined_symbols
from core.v4.fields.fields_parser import FieldsParser

# Tests for the FieldsParser that powers our Python implementation


@pytest.fixture(scope="function")
def parser():
    # parser without Mavis passed into it
    yield FieldsParser(AllFunctions(None, None), predefined_symbols(None))


def test_basic_usage(parser):
    code = "y = 3 * 4"

    result = parser.execute(code)

    assert result["errors"] == []
    symbols = result["symbols"]
    assert len(symbols) == 1  # only symbol returned is y

    sym_y = symbols[0]
    assert sym_y[0] == "y"
    assert sym_y[1] == 12


@pytest.mark.parametrize(
    "code, error_message",
    [
        ("import os", "'Import' not supported"),
        ("from math import *", "'ImportFrom' not supported"),
        ("__import__('os')", "Unknown function `__import__`"),
        ("dir(d)", "Unknown function `dir`"),
        ("__builtins__.sum([3,4])", "name '__builtins__' is not defined"),
        ("eval('1 + 2')", "Unknown function `eval`"),
        ("func = lambda x: x", "'Lambda' not supported"),
        ("().__class__", "Can't access private attribute `__class__`"),
        ("abs.__name__", "Can't access private attribute `__name__`"),
        (
            "d._Dataset__mavis_helpers",
            "Can't access private attribute `_Dataset__mavis_helpers`",
        ),
        ("def hello():\n\tpass", "'FunctionDef' not supported"),
        ("class X():\n\tpass", "'ClassDef' not supported"),
        ("open('myfile')", "Unknown function `open`"),
        ("raise ValueError", "'Raise' not supported"),
        ('f"3 + 4 is {3 + 4}"', "'JoinedStr' not supported"),
    ],
)
def test_dangerous_code(parser, code, error_message):
    """
    Insecure things we're testing

    import os                 # no import
    from math import *
    __import__('os')          # only whitelisted global objects / functions allowed
    dir(d)                    # only whitelisted global objects / functions allowed
    __builtins__.sum([3,4])   # only whitelisted global objects / functions allowed
    eval("1 + 2")             # no eval
    func = lambda x: x        # no lambdas
    func('hi')
    ().__class__              # no private attributes
    abs.__name__              # no private attributes
    d._Dataset__mavis_helpers # no private attributes

    def hello():              # No def
        pass

    class X:                  # No class
        pass
    """

    result = parser.execute(code)

    assert result["symbols"] == []
    errors = result["errors"]

    assert len(errors) == 1
    error = errors[0]

    assert error.message == error_message


@pytest.mark.parametrize(
    "code, expected",
    [
        ("x = 'hello {}'.format('there')", "hello there"),
        ("x = round(3.14)", 3),
        ("x = len(list((1, 2, 3, 4)))", 4),
    ],
)
def test_builtins(parser, code, expected):
    result = parser.execute(code)

    assert result["errors"] == []
    symbols = result["symbols"]
    assert len(symbols) == 1

    sym_expected = symbols[0]
    assert sym_expected[1] == expected


@pytest.mark.parametrize(
    "code, expected",
    [
        ("revenue = hf(23, 'revenue')", "$23.00"),
        ("diff = date_diff('2021-01-01', '2020-01-01', 'week')", 52.3),
        # ("add = date_add('2021-01-01', 'year', 10)", "2031-01-01"),
        ("people = plural('person')", "people"),
        ("percent = hf(0.8, 'percent')", "80%"),
        ("good = good_text('hello')", '<div class="mavis-impact good">hello</div>'),
    ],
)
def test_global_functions(parser, code, expected):
    result = parser.execute(code)

    assert result["errors"] == []
    symbols = result["symbols"]
    assert len(symbols) == 1

    sym_expected = symbols[0]
    assert sym_expected[1] == expected


@pytest.mark.parametrize(
    "code, expected",
    [
        ("x = ['hi'].pop()", "hi"),
    ],
)
def test_methods_on_objects(parser, code, expected):
    result = parser.execute(code)

    assert result["errors"] == []
    symbols = result["symbols"]
    assert len(symbols) == 1

    sym_expected = symbols[0]
    assert sym_expected[1] == expected


def test_syntax_errors(parser):
    code = "42106 = 'bad variable'"
    result = parser.execute(code)

    assert result["errors"][0].message == "cannot assign to literal here. Maybe you meant '==' instead of '='?"
