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
  eks_cluster_id = local.env_vars.locals.eks_cluster_id
  name = local.env_vars.locals.name
}

inputs = {
  name                    = local.name
  cidr                    = "10.111.0.0/16"
  azs                     = ["us-east-1a", "us-east-1b"]
  private_subnets         = ["10.111.16.0/20", "10.111.48.0/20"]
  public_subnets          = ["10.111.0.0/20", "10.111.32.0/20"]
  enable_dns_hostnames    = true
  map_public_ip_on_launch = false

  enable_nat_gateway        = true
  create_aws_vpn_connection = true
  single_nat_gateway             = true
  manage_default_security_group  = false
  manage_default_network_acl     = false
  manage_default_route_table     = false

  private_subnet_tags = {
    "kubernetes.io/cluster/${local.eks_cluster_id}" = "shared"
    "kubernetes.io/role/internal-elb"     = 1
    "Reach"     = "private"
  }

  public_subnet_tags = {
    "kubernetes.io/cluster/${local.eks_cluster_id}" = "shared"
    "kubernetes.io/role/elb"              = 1
    "Reach"     = "public"
  }

  tags = {
    terraform = "true"
    env       = local.name
  }
}
