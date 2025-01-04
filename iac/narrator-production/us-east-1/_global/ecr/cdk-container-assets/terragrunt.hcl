terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-ecr.git?ref=v1.6.0"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  repository_name                 = "cdk-hnb659fds-container-assets-479493230127-us-east-1"
  repository_image_tag_mutability = "MUTABLE"
  attach_repository_policy        = false
  create_lifecycle_policy         = false
}
