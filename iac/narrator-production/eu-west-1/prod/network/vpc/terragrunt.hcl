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
  name = local.env_vars.locals.name
  eks_cluster_id = local.env_vars.locals.eks_cluster_id
}


inputs = {
  name                           = local.name
  cidr                           = "10.141.0.0/16"
  azs                            = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  private_subnets                = ["10.141.16.0/20", "10.141.48.0/20", "10.141.80.0/20"]
  public_subnets                 = ["10.141.0.0/20", "10.141.32.0/20", "10.141.64.0/20"]
  enable_dns_hostnames    = true
  map_public_ip_on_launch = false

  enable_nat_gateway        = true
  create_aws_vpn_connection = true


  private_subnet_tags = {
    "kubernetes.io/cluster/${local.eks_cluster_id}" = "shared"
    "kubernetes.io/role/internal-elb"     = 1
  }

  public_subnet_tags = {
    "kubernetes.io/cluster/${local.eks_cluster_id}" = "shared"
    "kubernetes.io/role/elb"              = 1
  }

  tags = {
    terraform = "true"
    env       = local.name
  }
}

