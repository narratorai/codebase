terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-route53.git//modules/zones?ref=v2.10.2"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  zones = {
    "assets.narrator.ai" = {
      comment = "Portal static assets"
      tags = {
        terraform = true
      }
    }
  }
}