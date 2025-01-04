terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-acm.git?ref=v4.3.2"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  domain_name  = "us.narrator.ai"
  zone_id      = "Z00345682N2D3AO6SAIZA"

  subject_alternative_names = [
    "*.us.narrator.ai",
    "*.private.us.narrator.ai"
 ]

  wait_for_validation = false
}


