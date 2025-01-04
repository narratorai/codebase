import re


def slugify(string: str | None, replace_with="_"):
    """
    creates a clean title to display
    """
    if string is None:
        return None
    elif not isinstance(string, str):
        return str(string)
    else:
        return re.sub("[^A-Za-z0-9]+", replace_with, string.lower()).rstrip(replace_with)


def upper_word(j):
    if len(j) >= 2:
        return j[0].upper() + j[1:]
    else:
        return j


def title(s):
    """
    creates a clean title to display
    """
    if isinstance(s, str):
        for a in ("'", '"', "_"):
            s = s.strip(a)
        return " ".join(upper_word(j) for j in s.replace("_", " ").replace("-", " ").split(" "))
    else:
        return s


def is_email(s):
    regex = r"^(\w|\.|\_|\-)+[@](\w|\_|\-|\.)+[.]\w{2,3}$"
    return re.search(regex, s) is not None
