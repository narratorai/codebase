terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-ecr.git?ref=v1.6.0"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  repository_name                 = "redasher"
  repository_image_tag_mutability = "MUTABLE"
  attach_repository_policy        = false
  repository_image_scan_on_push   = false
  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        action = {
          type = "expire"
        }
        description  = "Expire untagged"
        rulePriority = 1
        selection = {
          countNumber = 30
          countType   = "sinceImagePushed"
          countUnit   = "days"
          tagStatus   = "untagged"
        }
      }
    ]
  })
}
