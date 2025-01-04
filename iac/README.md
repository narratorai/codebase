# Platform IAC 

## Contributing

Report issues/questions/feature requests on in the [issues](https://github.com/narratorai/platform-iac/issues/new) section.

Full contributing [guidelines are covered here](CONTRIBUTING.md).

## How do you deploy the infrastructure in this repo?

### Pre-requisites

1. Install:
     - [Terraform](https://www.terraform.io/) version `1.3.9`.
     - [Terragrunt](https://github.com/gruntwork-io/terragrunt) version `v0.44.0`.
     - [Terraform AWS Provider](https://releases.hashicorp.com/terraform-provider-aws/) version `4.56.0`.

   **Note:**
   Please move the downloaded AWS Provider to `~/.terraform.d/plugins/terraform-provider-aws` in order to force `Terragrunt` & `Terraform` to use this cached provider. This will speed up the execution & save you some bandwidth.
   Also please consider deleting the old custom AWS provider that we were maintaining as it will not be used in with this project.

2. Configure your AWS credentials using one of the supported [authentication mechanisms](https://www.terraform.io/docs/providers/aws/#authentication).


## How is the code in this repo organized?

The code in this repo uses the following folder hierarchy:

```sh
account
 └ _global
 └ region (us-east-1)
    └ _global
    └ environment (prod / stage etc)
       └ resource
```

Where:

- **Account**: At the top level are each of our AWS accounts, such as `production`, etc.

- **Region**: Within each account, there will be one or more [AWS
  regions](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html), such as `us-east-1`, `eu-west-1`, and `us-west-1`, where you've deployed resources. There may also be a `_global` folder that defines resources that are available across all the AWS regions in this account, such as IAM users and Route 53 hosted zones.

- **Environment**: Within each region, there will be one or more "environments", such as `prod`, `staging`, etc. Typically, an environment will correspond to a single [AWS Virtual Private Cloud (VPC)](https://aws.amazon.com/vpc/), which isolates that environment from everything else in that AWS account. There may also be a `_global` folder that defines resources that are available across all the environments in this AWS region, such as Route 53 A records, SNS topics, and ECR repos. The `sandbox` environment is present under `production/eu-west-1` and it works like any other country-specific environment.

- **Resource**: Within each environment, you deploy all the resources for that environment, such as EC2 Instances, Auto Scaling Groups, Databases, Load Balancers, and so on. 
  
Example:
We want to create a new service with sqs s3 rds and elasticache with security groups and cloudwatch alarms

```sh
production
 └ _global
 └ us-east-1
    └ _global
    └prod
       └ service
        └ rds
          └ terragrunt.hcl 
        └ elasticache
          └ terragrunt.hcl 
        └ sqs
          └ terragrunt.hcl 
        └ s3
          └ terragrunt.hcl
        └ sqs
          └ terragrunt.hcl
        └ security-groups
          └ elasticache-security-group-name
            └ terragrunt.hcl
          └ rds-security-group-name
            └ terragrunt.hcl
        └ cloudwatch
          └ rds
            └ terragrunt.hcl
          └ elasticache
            └ terragrunt.hcl

```

## Using a Terraform Module

To use a module in your Terraform templates, you can do it via Terraform and Terragrunt.

For example, to use v3.19.0 of the vpc module, you would add the following:

**When you are using a Terraform module you must provide the specific version.**

```hcl
// Terragrunt example 
terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-vpc.git?ref=v3.19.0"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  //your inputs
}
```

Note: the double slash (//) is intentional and required. It's part of Terraform's Git syntax (see module sources).

## How to manage secrets

When you need to manage a secret, you may have two options. Which one to use depends on where you need that secret.


### Manage secrets in Terragrunt using KMS on RDS

1. First, you need a KMS _key_id_. They are defined in `$aws_account/_global/$aws_region/kms/...`. The key_id_ is an UUID. You can see it when you first create a KMS or later in AWS console.
2. Then, you need a password plain text. That simple.
    > You must have `kms:Encrypt` permission on a given KMS to proceed. You can simply try if unsure.
    > You must log in to AWS in your terminal to proceed. 
3. Last, you need to run the command

```bash
aws --profile prod --region $aws_region kms encrypt --key-id $key_id --plaintext $your_password_plaintext --cli-binary-format raw-in-base64-out --query "CiphertextBlob"  --output text
```

*$key_id is unique per region and service.*

The output is a token that you need.

### Manage secrets in Terragrunt using Mozilla SOPS

Terragrunt support for Mozilla SOPS to Terragrunt. SOPS allows you to securely store secrets in JSON or YAML files encrypted via AWS KMS or PGP. For example, you might have a secrets.yaml with the contents:

```yaml
db:
  user: ENC[AES256_GCM,data:CwE4O1s=,iv:2k=,aad:o=,tag:w==]
  password: ENC[AES256_GCM,data:p673w==,iv:YY=,aad:UQ=,tag:A=]
```

To achieve this, you need to have a KMS ARN and [Mozilla SOPS](https://github.com/mozilla/sops) installed on your local machine . Then, you can create a file:

secrets.yaml

```yaml
db:
  user: myusername
  password: mysupersecretpassword
```

and run `sops --kms <KMS_ARN> -e -i secrets.yaml` to encrypt the `secrets.yaml` file and results into:

```yaml
db:
    user: ENC[AES256_GCM,data:2ZMScnTKqhnE3g==,iv:zQgLkjnX0H+Z9hGAfPugeKIlB67PzIxnZsqAFreMlno=,tag:9J/uGZiA1Bp3A73E92mBlg==,type:str]
    password: ENC[AES256_GCM,data:Vxpzc6l5l3Q3zMmtGZAinWY0MJTf,iv:Rxzl0nFVub1C3iPXJhypVSmXSewcW4gW18qo0ivnI4I=,tag:iA0lU2j03RgLtBc374Ubhg==,type:str]
sops:
    kms:
    -   arn: arn:aws:kms:us-east-1:660856479262:key/b6b5ac9a-f591-4a17-9097-a6bc5f2c1e49
        created_at: '2020-07-03T05:52:47Z'
        enc: AQICAHhLQSz/TTjlP6L/Rn4Uew11ve/w04sXJ3JIG8AkMhJlagE7PsSkrj1kdafFgKM9Vw9gAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMc8BualK/kZ/9AUxvAgEQgDthzKjvDofWn+MMnkHFHTCiviPDCtPTsAhq/dfur0uMGaMW7VG252KuKFHVLS3P9T4/k85Ag4vaNTIB2g==
        aws_profile: ""
    gcp_kms: []
    azure_kv: []
    lastmodified: '2020-07-03T05:52:48Z'
    mac: ENC[AES256_GCM,data:2rCHH6S8zAOx4kKlsOEiblNi+J6sxyLb9uqOLS3JASxtNGGqt3ozTy6hmt+I82y28zZ3t0sq4nQbcL+/sLSjlL+1wG0f6m6baQHlr04VYpLC4kFYwXI8q8Zd30Voj2RqXmK43QLRS1d9Z6dsYkrmTnMBWDFzRICBGfiOeMxtn+Q=,iv:8OSEHbWo66VseG79qdxLDfdFd6KHAdQJ7ZwOQOIs9hY=,tag:A/lGu/bZbufQHZ4UbzYf6A==,type:str]
    pgp: []
    unencrypted_suffix: _unencrypted
    version: 3.5.0
```

>When you need to encrypt something outside the `production` account ie. `staging` you should append the atlantis role when running the SOPS encrypt command. It will add a `role` field in the sops.kms config of the .yaml file.
>
>The command should be: `sops --kms "<KMS_ARN>+<ROLE_ARN>" -e -i secrets.yaml`

Note that the user and password are encrypted with one of the mechanisms supported by SOPS, which means it is safe to check this file into version control. You use the new `sops_decrypt_file()` helper in your terragrunt.hcl files to automatically read the file and decrypt the contents, allowing you to pass those values to your Terraform code:

```hcl
locals {
  secrets = yamldecode(sops_decrypt_file(find_in_parent_folders("secrets.yml")))
}

inputs = {
  user     = local.secrets.db.user
  password = local.secrets.db.password
}
```

This approach allows you to avoid putting any plain text secrets directly in version control, while still managing everything as code. Note that any secrets you pass to Terraform may be stored in its state file in plain text, so make sure you store that state file in an encrypted format too s3 encrption is by default enabled in our s3 buckets.

**Note:** *Unfortunately, Terraform still plans and shows differences in passwords that are not obfuscated with Terraform Sensitive attribute. For example, passwords stored in `custom-json` for the OpsWorks stacks will still output the passwords in plaintext eventhough in the terragrunt file it's encrypted with Mozilla SOPS.*

[Terragrunt Documentation](https://terragrunt.gruntwork.io/docs/reference/built-in-functions/#sops_decrypt_file)

## Configuring Terragrunt to assume an IAM role

To tell Terragrunt to assume an IAM role, just set the --terragrunt-iam-role command line argument:

```sh
terragrunt apply --terragrunt-iam-role "arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME
```

## Clearing the Terragrunt cache

Terragrunt creates a '.terragrunt-cache' folder in the current working directory as its scratch directory. It downloads your remote Terraform configurations into this folder, runs your Terraform commands in this folder, and any modules and providers those commands download also get stored in this folder. You can safely delete this folder any time and Terragrunt will recreate it as necessary.

```sh
find . -type d -name ".terragrunt-cache"
find . -type d -name ".terragrunt-cache" -prune -exec rm -rf {} \;
```

## Terragrunt Documentation

[Terragrunt](https://terragrunt.gruntwork.io/docs/)
