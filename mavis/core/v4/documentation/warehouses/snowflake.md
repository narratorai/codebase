### Prepare your Warehouse


<br>

**Create a User, Role, and Grant Access**

1. Login to your console

2. Run the query below, substituting `user_password`, `warehouse_name` and `database_name`.

```sql
-- create variables for user / password / role / warehouse
-- / database (needs to be uppercase for objects)
set role_name = 'NARRATOR_ROLE';
set user_name = 'narrator_user';
set user_password = 'password123';
set warehouse_name = 'COMPUTE_WH';
set database_name = 'DOH';

-- change role to securityadmin for user / role steps
use role securityadmin;

-- create role for narrator
create role if not exists identifier($role_name);
grant role identifier($role_name) to role SYSADMIN;

-- create a user for narrator
create user if not exists identifier($user_name)
password = $user_password
default_role = $role_name
default_warehouse = $warehouse_name;

grant role identifier($role_name) to user identifier($user_name);

-- change role to sysadmin for warehouse / database steps
use role sysadmin;

-- grant narrator role access to warehouse
grant USAGE
on warehouse identifier($warehouse_name)
to role identifier($role_name);

-- grant narrator access to database
grant CREATE SCHEMA, MONITOR, USAGE
on database identifier($database_name)
to role identifier($role_name);

commit;

```



## If you have a Network policy

### If US

```
ALTER NETWORK POLICY <your_network_policy_name> SET {{[ALLOWED_IP_LIST] = ('3.219.40.79', '44.207.201.247', '3.225.114.129', '34.234.180.42', '107.20.159.185', '3.222.183.38', '34.234.60.47')]}};
```

### If EU

```
ALTER NETWORK POLICY <your_network_policy_name> SET {{[ALLOWED_IP_LIST] = ('3.248.69.72', '54.73.151.93', '34.240.138.192', '34.234.60.47')]}};
```



[Create network policy] (https://docs.snowflake.com/en/sql-reference/sql/create-network-policy.html)


If you don't have a Snowflake Network Policy, you must create a network policy to safelist Narrators's IP addresses. Use the CREATE NETWORK POLICY command to specify the IP addresses that are allowed access to your Snowflake account.

<br>


NOTE: Make sure to add the IP addresses you want to use to access Snowflake because Snowflake automatically blocks all IP addresses that are not in the allowed list.

<br>

For example, to create the network policy to safelist the IPs if you are in the US region, execute the following command:

### If US

```
CREATE NETWORK POLICY <narrator_ip_whitelist_us> ALLOWED_IP_LIST = ('3.219.40.79', '44.207.201.247', '3.225.114.129', '34.234.180.42', '107.20.159.185', '3.222.183.38', '34.234.60.47');
```

### If EU

```
CREATE NETWORK POLICY <narrator_ip_whitelist_us> ALLOWED_IP_LIST = ('3.248.69.72', '54.73.151.93', '34.240.138.192', '34.234.60.47');
```

<br>


Full instructions [here](doc:snowflake)
