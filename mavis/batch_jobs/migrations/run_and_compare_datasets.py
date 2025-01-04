from core.decorators import with_mavis
from core.graph import graph_client
from core.graph.sync_client.enums import materialization_type_enum
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis

# from tests.dataset.translate_test import compare_sql


def test_dataset(mavis, id, group_slug, correct=True):
    d_obj = Dataset(mavis, id, limit=10_000)
    orginial_quer = d_obj.qm_query(group_slug, offset=100).to_query()
    # print(d_obj.model.json())
    print("\n\nCORRECT QUERY\n\n")
    print(orginial_quer)
    print("\n\nNEW\n\n")

    d_obj.version = 2
    try:
        translated_query = d_obj.qm_query(group_slug, offset=100).to_query()
    except Exception as e:
        # print(json.dumps(d_obj.obj, indent=2))
        print(d_obj.model.json())
        raise e
    print(translated_query)

    # Compare the queries
    # compare_sql(orginial_query2, translated_query2)


@with_mavis
def run_and_compare_datasets(mavis: Mavis, company_slug=None):
    for k in materialization_type_enum:
        mats = graph_client.get_all_materializations(company_id=mavis.company.id, kind=k).materializations
        for m in mats:
            print(m)
            test_dataset(mavis, m.dataset_id, m.group_slug)
