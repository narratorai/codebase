terraform {
  source = "git@github.com:grem11n/terraform-aws-vpc-peering.git"
}

include "root" {
  path = find_in_parent_folders()
}

generate "provider2" {
  path      = "provider.tf"
  if_exists = "overwrite"
  contents = <<EOF
  provider "aws" {
    alias      = "this"
    region     = "us-east-1"
  }

  provider "aws" {
    alias      = "peer"
    region     = "eu-west-1"
  }
EOF
}



dependency "vpc" {
  config_path = "../../vpc/"
}

dependency "vpc-prod-eu" {
  config_path = "../../../../../eu-west-1/prod/network/vpc/"
}


inputs = {
  this_vpc_id =  dependency.vpc.outputs.vpc_id
  peer_vpc_id = dependency.vpc-prod-eu.outputs.vpc_id

  auto_accept_peering = true
}

