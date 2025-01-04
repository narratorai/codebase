terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-vpc.git?ref=v3.19.0"
}

include "root" {
  path = find_in_parent_folders()
}

locals {
  # Automatically load environment-level variables
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  # Extract out common variables for reuse
  name      = local.env_vars.locals.name
  env       = local.env_vars.locals.env
}


inputs = {
  name                           = local.name
  cidr                           = "10.212.0.0/16"
  azs                            = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets                = ["10.212.16.0/20", "10.212.48.0/20", "10.212.80.0/20"]
  public_subnets                 = ["10.212.0.0/20", "10.212.32.0/20", "10.212.64.0/20"]
  enable_dns_hostnames           = true
  map_public_ip_on_launch        = false

  private_subnet_tags = {
    "Reach"     = "private"
  }

   public_subnet_tags = {
    "Reach"     = "public"
  }

  tags = {
    terraform = "true"
    env = local.env
  }
}

