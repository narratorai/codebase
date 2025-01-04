from dataclasses import dataclass

#
# !!! Security sensitive code !!!
#
# Modifying this file requires code review
#


class Dataset:
    """
    Wrapper class for Dataset
    Allow getting groups directly from the instance
    """

    # NOTE
    # y = d.__mavis_helpers         <-- this is protected in Python
    # z = d._Dataset__mavis_helpers <-- this is not
    # To make it truly private the fields parser tosses out any calls to attributes that start with an underscore

    def __init__(self, slug: str, dataset_query_object, mavis_helpers):
        self.slug = slug
        self.__mavis_helpers = mavis_helpers
        self.group_slugs = [group["slug"] for group in dataset_query_object["all_groups"]]

    def __getattr__(self, name):
        """
        Create attributes for each group slug; call to Mavis to load
        """

        if name in self.group_slugs:
            return self.__mavis_helpers.get_group(self, name)
        elif name == "parent":
            return self.__mavis_helpers.get_group(self, None)
        else:
            raise AttributeError(name)

    def __str__(self):
        return f"[Dataset] {self.slug}: {len(self.group_slugs)} groups \n\t"

    def pretty_print(self):
        groups = ",\n\t".join([slug for slug in self.group_slugs])
        return f"{self}\n\t{groups}"


class Group(list):
    """
    Class for expressing a dataset table (like a group)
    """

    def __init__(self, slug, name, rows, columns):
        super().__init__()

        if len(rows) > 0:
            self.extend([Row(index, self, row) for index, row in enumerate(rows)])

        self.columns = [Column(group=self, *column.values()) for column in columns]  # noqa: B026
        self.column_map = {column.name: column for column in self.columns}
        self.slug = slug
        self.name = name

    def __str__(self):
        return f"[Group] {self.name}: {len(self.columns)} columns, {len(self)} rows"

    def pretty_print(self):
        rows = ",\n\t".join([column.name for column in self.columns])
        return f"{self}\n\t{rows}"

    def __getattr__(self, name):
        """
        Create attributes for each column
        """
        if name in self.column_map.keys():
            return self.column_map[name]
        else:
            raise AttributeError(name)


class Row(dict):
    """
    Represents a dataset group row
    """

    def __init__(self, index: int, group: Group, data: dict):
        super().__init__(data)
        self.index = index
        self.group = group

    def __getattr__(self, name):
        if name in self.keys():
            return self[name]
        else:
            raise AttributeError(name)

    def __str__(self):
        return f'[Row] Index {self.index} of group "{self.group.name}"'

    def pretty_print(self):
        values = "\n\t".join([f"{column}: {self[column]}" for column in self.keys()])
        return f"{self}\n\t{values}"


@dataclass
class Column:
    """
    Dataset group column
    """

    name: str
    friendly_name: str
    type: str
    group: Group

    def __str__(self):
        return f'[Column] id: {self.name}, group: "{self.group.name}"'
