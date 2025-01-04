from core.decorators.task import task
from core.errors import QueryRunError, SilenceError
from core.utils import todt
from core.v4.mavis import initialize_mavis


@task(queue_name="run_query")
def async_run_query_raw(company_slug, query, use_admin=False, skip_limit_check=False):
    mavis = initialize_mavis(company_slug)
    mavis._run_query_raw(query, use_admin=use_admin, skip_limit_check=skip_limit_check)


@task(queue_name="run_query", store_results=True)
def async_batch_run(company_slug, s3_key, task_execution_id, started_at):
    mavis = initialize_mavis(company_slug)

    # update the task execution id
    if task_execution_id:
        mavis.set_message_id(task_execution_id, todt(started_at))

    path = ["async", "queries", f"{s3_key}.json"]

    # get the file
    res = mavis.company.s3.get_file(path)

    # run all the queries
    res["results"] = dict()
    for q in res["queries"]:
        try:
            res["results"][q] = mavis.run_query(q, within_minutes=res["within_minutes"]).dict()
        except (QueryRunError, SilenceError) as exc:
            res["results"][q] = dict(error="QueryRunError: " + str(exc), query=q)
            if res.get("raise_on_error"):
                break
        except Exception as e:
            res["full_error"] = str(e)
            break
    res["done"] = True
    mavis.company.s3.upload_object(res, path)
    return True
