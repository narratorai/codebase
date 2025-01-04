terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-sqs.git?ref=v4.0.2"
}

include "root" {
  path = find_in_parent_folders()
}


inputs = {
  name = "mavis-prod"
  tags = {
    VantaOwner            = "ahmed@narrator.ai"
  }
}
