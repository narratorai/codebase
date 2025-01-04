terraform {
  source = "git@github.com:idealo/terraform-aws-opensearch?ref=v2.2.0"
}

include "root" {
  path = find_in_parent_folders()
}

locals {
  # Automatically load environment-level variables
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  # Extract out common variables for reuse
  name      = local.env_vars.locals.name
}

#generate "provider" {
#  path      = "provider.tf"
#  if_exists = "overwrite_terragrunt"
#  contents  = <<EOF
#provider "aws" {
#  alias      = "this"
#  region     = "${local.this_aws_region}"
#}
#provider "aws" {
#  alias      = "peer"
#  region     = "${local.peer_aws_region}"
#}
#EOF
#}


inputs = {
  cluster_name    = local.name
  cluster_domain  = "private.us.narrator.ai"
  cluster_domain_private = true
  cluster_version = "2.11"
  master_instance_type = "t3.medium.search"
  hot_instance_type = "t3.medium.search"

  saml_enabled = false
}
