# Index Table

If the customer column is human readable (i.e. email) we can index all the customers to allow the customer journey feature to autocomplete the customer.


-----



# FAQ

**Where is the data stored?**

We index the customer using a redis cluster in global region.  We will soon be adding support for region specific indexes.

<br>


**Is it bad to turn it off?**

The index is a `nice to have` feature that just allows autocomplete.  You do not need to use it.
