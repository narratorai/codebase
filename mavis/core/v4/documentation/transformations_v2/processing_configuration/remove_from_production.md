# Remove from production

Sometime we run into errors in an activity so we want to delete it but we don't want to loose the query.

This is where `remove from production`.  It is just like deleting a transformation but doesn't delete the query.


### What does this do?

- Delete the data from {table} that was generated by this transformation
- Removes this transformation from updating
- Converts this transformation to pending
- If this is the only transformation that generates that activity, then it will remove this activity
