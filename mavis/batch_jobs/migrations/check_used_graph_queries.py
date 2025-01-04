import os
import re

# # @with_mavis
# def check_used_graph_queries(mavis: Mavis, company_slug=None):
#     #  Define the paths and ignored folders
#     codebase_root = "/Users/ahmedelsamadisi/Documents/mavis/"
#     sync_clients_folder = codebase_root + "core/graph/sync_client"
#     ignore_folders = [".env", "__pycache__"]

#     unused_files = find_unused_files(sync_clients_folder, codebase_root, ignore_folders)

#     print("Unused files in sync_clients folder:")
#     for file in unused_files:
#         print(file)


def find_unused_files(sync_clients_folder, codebase_root, ignore_folders=None):
    if ignore_folders is None:
        ignore_folders = []

    # Get all file names in the sync_clients folder
    sync_files = {f[:-3] for f in os.listdir(sync_clients_folder) if f.endswith(".py")}

    all_file_or = "|".join(re.escape(f) for f in sync_files)

    print(all_file_or)
    # Regex to match any of the sync files
    sync_file_pattern = re.compile(r"\b(?:" + all_file_or + r")\b")

    # Track referenced files
    referenced_files = set()

    # Walk through the codebase and search for references
    for root, _, files in os.walk(codebase_root):
        # Skip ignored folders
        if any(ignored in root for ignored in ignore_folders):
            continue

        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                print(file_path)
                with open(file_path, "r") as f:
                    content = f.read()
                    matches = sync_file_pattern.findall(content)
                    print(matches)
                    referenced_files.update(matches)

    # Find files that are not referenced
    unused_files = sync_files - referenced_files

    return unused_files


#  Define the paths and ignored folders
codebase_root = "/Users/ahmedelsamadisi/Documents/mavis/"
sync_clients_folder = codebase_root + "core/graph/sync_client"
ignore_folders = [".env", "__pycache__", ".venv", "graph"]

unused_files = find_unused_files(sync_clients_folder, codebase_root, ignore_folders)

print("Unused files in sync_clients folder:")
for file in unused_files:
    print(file)
