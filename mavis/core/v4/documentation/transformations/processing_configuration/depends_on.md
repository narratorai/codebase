# Dependence Resync

This can be helpful when an activity is derived from another activity. When the "Depends On" transformation is resynced or modified, the current transformation will also be resynced.


--------


# Use Cases


**Data that uses your `{table}` in the SQL**

If you have a transformation that is on top of your Activity Schema ({table}), you may want to have this transformation dependent on the transformations that make up the data you are using in this SQL.  If you change that transformation, then you want to have this be resynced too.
