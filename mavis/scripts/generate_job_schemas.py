#! /usr/bin/env python3

"""
walk all batch_jobs and output json schemas from their options
"""

import inspect
import json
import os
import sys
from pathlib import Path
from runpy import run_path

# Add core to the python path
core_path = Path("./core")
sys.path.append(str(core_path.resolve()))

batch_job_paths = Path("batch_jobs").glob("**/*.py")

for path in batch_job_paths:
    try:
        mod = run_path(path)
        main = mod.get("main")
        Options = mod.get("Options")

        if Options:
            schema = Options.schema()
            if main:
                description = (
                    [schema["description"], inspect.getdoc(main)].join("\n")
                    if hasattr(schema, "description")
                    else inspect.getdoc(main)
                )
                if description:
                    schema["description"] = str(description).strip()

            filename = f"{'.'.join(str(path).replace(os.sep, '.').split('.')[:-1])}.json"
            filepath = os.path.join(".tmp", "job_schemas", filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            fh = open(filepath, "w")
            fh.write(json.dumps(schema, indent=2))
            fh.close()

    except Exception as e:
        print(f"ERROR for {path}: {e}")
