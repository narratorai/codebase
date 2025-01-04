Designed for [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server/) and [Azure SQL Database](https://azure.microsoft.com/en-us/services/sql-database/), with experimental support for [Azure Synapse](https://azure.microsoft.com/en-us/services/synapse-analytics/).

**User**

Ensure it's in the form `user@server-name`, where server-name is your server address without the .database-windows.net suffix.


## Allowlist IPs
Narrator uses static IPs to connect to your warehouse.

### US IPS
We have 2 regions in the US and ask you to white list IPs for both in case anything fails, we can route traffic to the other region.



```
3.219.40.79
```

```
44.207.201.247
```

```
3.225.114.129
```

```
34.234.180.42
```

```
107.20.159.185
```

```
3.222.183.38
```

```
34.234.60.47
```

<br>

### EU IPS


```
3.248.69.72
```

```
54.73.151.93
```

```
34.240.138.192
```

```
34.234.60.47
```


<br>


## GRANTS required

Narrator query editor allows uses to read data from the warehouse to model the data.  For permission we need to grant the following:


```sql
ALTER ROLE db_datareader ADD MEMBER [narrator_user]
```


Narrator creates a schema called `narrator` & `narrator_mv`(default can be changed in company settings) so we need to grant the following:

```sql
ALTER ROLE db_datawriter ADD MEMBER [narrator_user]
```


We also need to be able to kill queries that are running for too long. We recommend creating a new user with the following grants:

```sql
GRANT ALTER ANY CONNECTION TO [narrator_user]
```

OR

```sql
ALTER SERVER ROLE ##MS_ProcessAdmin## ADD MEMBER [narrator_user]
```
