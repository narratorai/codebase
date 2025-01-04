terraform {
  source = "git@github.com:cyberlabrs/terraform-aws-opensearch"
}

include "root" {
  path = find_in_parent_folders()
}

dependency "vpc" {
  config_path = "../../network/vpc"
}

inputs = {
  name                                           = "fluentbit"
  region = "us-east-1"
  advanced_security_options_enabled              = true
  default_policy_for_fine_grained_access_control = true
  internal_user_database_enabled                 = true
  node_to_node_encryption                        = true
  instance_type                                  = "r6g.large.search"
  encrypt_at_rest = {
    enabled = true
  }
}