from core.v4.mavis import Mavis


def parsing_git(mavis: Mavis, **kwargs):
    file = "/Users/ahmed/Downloads/scan-results-4.19.21 4.txt"
    rows = []
    ii = 0

    key = ["commit", "author", "date"]

    # open the file
    with open(file) as f:  # noqa: ASYNC101
        current_repo = None
        obj = {"details": ""}

        for line in f:
            if line[2:].startswith("/Users/ramin/"):
                current_repo = line[2:].strip()

            for k in key:
                if line[2:].lower().startswith(k):
                    # reset after the commit
                    if k == "commit":
                        if all(tk in obj.keys() for tk in key + ["details", "repo"]):
                            rows.append(obj)
                        obj = dict(repo=current_repo, details="")

                    obj[k.lower()] = line[(len(k) + 3) :].strip()
                    break
            else:
                if obj.get("commit"):
                    obj["details"] += line

            ii += 1

    data = dict(
        rows=rows,
        columns=[dict(name=c, type="string") for c in key + ["details", "repo"]],
    )

    mavis.sync_data_to_table(
        data,
        mavis.qm.Table(schema="ahmed_data", table="github_dump"),
        "drop_and_create",
    )
