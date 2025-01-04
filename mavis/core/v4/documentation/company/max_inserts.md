# Maximum Rows to Insert

Narrator cannot simply insert the entire transformation data into your activity stream because based on size this may be too expensive.  On top of this, we will also need to apply Identity Resolution and computing the cache columns on the data.  

This allows you to control how Narrator will break up each insert.  

### What Narrator will do:
1. Count the rows in the transformation since the last update
2. Find the date where the rows add up to at most`Maximum Rows to Insert`
3. Insert this data


> Don't worry, we will run the transformation processing back to back to ensure your data is up to date as soon as possible.
