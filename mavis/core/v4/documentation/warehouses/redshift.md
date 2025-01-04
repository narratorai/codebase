## Allowlist IPs
Narrator uses static IPs to connect to your warehouse.
[Redshift Instructions](doc:connect-a-warehouse#adding-narrator-to-awss-allowlist-redshift)

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

## Setup Options
- Automated Setup (recommended): Enter an Admin User and Narrator will create a new user and grant itself access
- Manual Setup: You create a new user and you manage its access. [Instructions](doc:redshift#manual-setup)

> All communication between Narrator and your warehouse is encrypted.
> We take security seriously! [Learn more](doc:security)


<br>

## Connecting using SSH Tunnel

[Instructions](doc:connect-a-warehouse#using-an-ssh-tunnel)
**Narrator's Public Key**

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHQLZ/BQf5GDPRfXmHt9ecmChGjhOWZsZZOGsn82M1nJ
```

<br>


## Troubleshooting

If you see a permission error (Please connect a user with CREATE permissions) run the command below as an admin to grant the right permissions.

```sql
-- grant access to create on their database
GRANT CREATE ON DATABASE INSERT_WAREHOUSE_NAME_HERE TO narrator_user;
```
