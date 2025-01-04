terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-vpc.git?ref=v5.5.1"
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
  cidr                           = "10.131.0.0/16"
  azs                            = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets                = ["10.131.16.0/20", "10.131.48.0/20", "10.131.80.0/20"]
  public_subnets                 = ["10.131.0.0/20", "10.131.32.0/20", "10.131.64.0/20"]
  enable_dns_hostnames           = true
  map_public_ip_on_launch        = false
  single_nat_gateway             = true
  manage_default_security_group  = false
  manage_default_network_acl     = false
  manage_default_route_table     = false

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

