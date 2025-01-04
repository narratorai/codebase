terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-vpc.git//modules/vpc-endpoints?ref=v3.19.0"
}

include "root" {
  path = find_in_parent_folders()
}

dependency "vpc" {
  config_path = "../vpc"
}

dependency "sg" {
  config_path = "../security-groups/vpc-endpoint"
}

locals {
  # Automatically load environment-level variables
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  # Extract out common variables for reuse
  name = local.env_vars.locals.name
}

inputs = {
  vpc_id             = dependency.vpc.outputs.vpc_id
  security_group_ids = [dependency.sg.outputs.security_group_id]

  endpoints = {
    s3 = {
      service         = "s3"
      service_type    = "Gateway"
      route_table_ids = dependency.vpc.outputs.private_route_table_ids
      tags = {
        Name = "${local.name}-s3"
      }
    },
    autoscaling = {
      service             = "autoscaling"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-autoscaling" }
    },
    ecr-api = {
      service             = "ecr.api"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-ecr.api" }
    },
    ecr-dkr = {
      service             = "ecr.dkr"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-ecr.dkr" }
    },
    ec2 = {
      service             = "ec2"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-ec2" }
    },
    ec2messages = {
      service             = "ec2messages"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-ec2messages" }
    },
    elasticloadbalancing = {
      service             = "elasticloadbalancing"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-elasticloadbalancing" }
    },
    sts = {
      service             = "sts"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-sts" }
    },
    kms = {
      service             = "kms"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-kms" }
    },
    logs = {
      service             = "logs"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-logs" }
    },
    ssm = {
      service             = "ssm"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-ssm" }
    },
    ssmmessages = {
      service             = "ssmmessages"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-ssmmessages" }
    },
    eks = {
      service             = "eks"
      subnet_ids          = dependency.vpc.outputs.private_subnets
      private_dns_enabled = true
      tags                = { Name = "${local.name}-eks" }
    }
  }
}
