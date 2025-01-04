#! /usr/bin/env python3

import json
import sys
from pathlib import Path

# Set up the path
root_path = Path(".")
sys.path.append(str(root_path.resolve()))

from core.api.main import app  # noqa: E402

with open("openapi/mavis.json", "w") as f:
    f.write(json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n")
