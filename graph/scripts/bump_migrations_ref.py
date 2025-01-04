#! /usr/bin/env python3

"""
writes to packages/codegen/REF
- the id of the last migration directory
- the hash of the metadata directory
"""

import json
import glob
import hashlib
from _hashlib import HASH as Hash
from pathlib import Path
from typing import Union

# https://stackoverflow.com/questions/24937495/how-can-i-calculate-a-hash-for-a-filesystem-directory-using-python
def md5_update_from_file(filename: Union[str, Path], hash: Hash) -> Hash:
    assert Path(filename).is_file()
    with open(str(filename), "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash.update(chunk)
    return hash

def md5_file(filename: Union[str, Path]) -> str:
    return str(md5_update_from_file(filename, hashlib.md5()).hexdigest())

def md5_update_from_dir(directory: Union[str, Path], hash: Hash) -> Hash:
    assert Path(directory).is_dir()
    for path in sorted(Path(directory).iterdir(), key=lambda p: str(p).lower()):
        hash.update(path.name.encode())
        if path.is_file():
            hash = md5_update_from_file(path, hash)
        elif path.is_dir():
            hash = md5_update_from_dir(path, hash)
    return hash

def md5_dir(directory: Union[str, Path]) -> str:
    return str(md5_update_from_dir(directory, hashlib.md5()).hexdigest())


# Get the migration_id
migrations = glob.glob('migrations/**/*')
migration_ids = [int(m.split("/")[-1].split('_')[0]) for m in migrations]
migration_ids.sort()
newest_migration_id = str(migration_ids[-1])

# Get the metadata hash
metadata_hash = md5_dir('metadata')

# Write the ref file
with open("packages/codegen/REF", "w") as f:
    f.write(json.dumps({
        "migration_id": newest_migration_id,
        "metadata_hash": metadata_hash
    }))
