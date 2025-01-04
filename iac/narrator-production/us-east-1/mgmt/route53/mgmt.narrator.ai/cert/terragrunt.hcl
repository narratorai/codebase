terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-acm.git?ref=v4.3.2"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  domain_name  = "mgmt.narrator.ai"
  zone_id      = "Z0540896185OF024XPISW"

  subject_alternative_names = [
    "*.mgmt.narrator.ai",
    "*.private.mgmt.narrator.ai" 
 ]

  wait_for_validation = true
}


