terraform {
  source = "git@github.com:grem11n/terraform-aws-vpc-peering.git"
}

include "root" {
  path = find_in_parent_folders()
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite"
  contents = <<EOF
  provider "aws" {
    alias      = "this"
    region     = "us-east-1"
  }

  provider "aws" {
    alias      = "peer"
    region     = "us-east-1"
  }
EOF
}



dependency "vpc" {
  config_path = "../../vpc/"
}


inputs = {
  this_vpc_id = dependency.vpc.outputs.vpc_id
  peer_vpc_id = "vpc-9f03b0e5"

  auto_accept_peering = true
}
