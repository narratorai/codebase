import pytest

from core.v4.analysisGenerator import create_aeval


@pytest.fixture(scope="function")
def aeval():
    yield create_aeval({})


def test_exploit(aeval):
    aeval("loads(b'c__builtin__\\neval\\n(Vprint(\"Ran eval!\")\\ntR.')")
    assert len(aeval.error) == 1
    assert aeval.error[0].msg == "name 'loads' is not defined"


def test_numpy_not_loaded(aeval):
    # a selection of symbols brought in with nuympy that we're unlikely to reimplement
    for symbol in [
        "broadcast",
        "c_",
        "csingle",
        "linalg",
        "longcomplex",
        "ndindex",
        "ndenumerate",
        "s_",
    ]:
        assert symbol not in aeval.symtable.keys()


def test_dangerous_functions(aeval):
    for symbol in [
        "open",
        "load",
        "loads",
        "loadtxt",
        "save",
        "memmap",
        "__builtins__",
        "__include__",
        "os",
    ]:
        assert symbol not in aeval.symtable.keys()
