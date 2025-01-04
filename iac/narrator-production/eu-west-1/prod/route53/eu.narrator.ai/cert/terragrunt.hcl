terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-acm.git?ref=v4.3.2"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  domain_name  = "eu.narrator.ai"
  zone_id      = "Z011793229UAGT1EB1ZIN"

  subject_alternative_names = [
    "*.eu.narrator.ai",
    "*.private.eu.narrator.ai" 
 ]

  wait_for_validation = false
}


