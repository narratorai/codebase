terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-route53.git//modules/zones?ref=v2.10.2"
}

include "root" {
  path = find_in_parent_folders()
}

dependency "vpc" {
  config_path = "../../../network/vpc"
}

inputs = {
  zones = {
    "mgmt.narrator.ai" = {
      comment = "mgmt public domain"
      tags = {
        terraform = true
        infra_v2 = true
      }
    },
    "private.mgmt.narrator.ai" = {
      comment = "mgmt private domain"
      vpc = [
        {
          vpc_id = dependency.vpc.outputs.vpc_id
        }
      ]
      tags = {
        terraform = true
        infra_v2 = true
      }
    },
  }
}


