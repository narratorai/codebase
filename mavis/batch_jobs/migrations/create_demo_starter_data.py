import requests

from core.decorators import mutex_task, with_mavis
from core.v4.mavis import Mavis


def get_words():
    word_url = "https://raw.githubusercontent.com/smashew/NameDatabases/master/NamesDatabases/surnames/us.txt"
    response = requests.get(word_url)
    return response.text.splitlines()


def create_words(mavis: Mavis):
    words = get_words()
    data = dict(
        columns=[dict(name="id", type="integer"), dict(name="word", type="string")],
        rows=[dict(id=ii, word=w) for ii, w in enumerate(words) if not w.isupper()],
    )

    mavis.sync_data_to_table(
        data,
        mavis.qm.Table(schema="demo", table="words"),
        update_kind="drop_and_create",
        add_ons=dict(
            sortkey="word",
        ),
    )


def create_numbers(mavis: Mavis):
    N = 10000000
    data = dict(
        columns=[dict(name="number", type="integer")],
        rows=[dict(number=num) for num in range(N)],
    )

    # sync the data
    mavis.sync_data_to_table(
        data,
        mavis.qm.Table(schema="demo", table="numbers"),
        update_kind="drop_and_create",
        add_ons=dict(
            sortkey="number",
        ),
    )


@mutex_task()
@with_mavis
def create_demo_starter_data(mavis: Mavis, **kwargs):
    mavis.create_schema("demo")

    create_numbers(mavis)
    create_words(mavis)

    mavis.get_warehouse_schema(refresh=True)
