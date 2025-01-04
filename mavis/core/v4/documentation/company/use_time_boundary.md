# Use Time Boundary

Time boundary is the common way data warehouses diff date.


### Example 1
DATE_DIFF ( saturday the 4th and monday the 6th):

- If you date_diff by `day`, you get `2`  (which makes sense)
- If you date_diff by `week`, you get `1` week in between.  That is cause sunday is the boundary and thus you passed 1 boundary



### Example 2
DATE_DIFF ( sunday 4th at 11:30pm and Monday 5th at 12:10am ):

- If you date_diff by `hour`, you get `1`  (which makes sense)
- If you date_diff by `day`, you get `1`  (which is confusing)
- If you date_diff by `week`, you get `1` week in between.  That is cause sunday is the boundary and thus you passed 1 boundary



### Example 2
DATE_DIFF ( sunday 4th at 10:30pm and sunday 4th at 11:30pm ):

- If you date_diff by `hour`, you get `1`  (which makes sense)
- If you date_diff by `day`, you get `0`  (which makes sense)



----

# SO What?

When you do time between 2 events, this is really confusing and most users don't get it so at Narrator we subtract the `seconds` and normalize it.
- Minutes Diff = SECOND_DIFF / 60
- Hours Diff = SECOND_DIFF / 60 / 60
- Days Diff = SECOND_DIFF / 60 / 60 / 24
....


<br>

If you like the way the warehouse does it, then you can check this checkbox and it will just do the warehouse DATE_DIFF.
