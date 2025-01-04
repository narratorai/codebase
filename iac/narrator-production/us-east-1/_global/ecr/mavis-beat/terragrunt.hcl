terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-ecr.git?ref=v1.6.0"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  repository_name                 = "mavis-heartbeat"
  repository_image_tag_mutability = "MUTABLE"
  attach_repository_policy        = false
  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        action = {
          type = "expire"
        }
        description  = "expire untagged images"
        rulePriority = 1
        selection = {
          countNumber = 180
          countType   = "sinceImagePushed"
          countUnit   = "days"
          tagStatus   = "untagged"
        }
      },
      {
        action = {
          type = "expire"
        }
        description  = "expire pull request images"
        rulePriority = 2
        selection = {
          countNumber = 14
          countType   = "sinceImagePushed"
          countUnit   = "days"
          tagPrefixList = [
            "pr-",
          ]
          tagStatus = "tagged"
        }
      },
      {
        action = {
          type = "expire"
        }
        description  = "expire commit push images"
        rulePriority = 3
        selection = {
          countNumber = 30
          countType   = "sinceImagePushed"
          countUnit   = "days"
          tagPrefixList = [
            "push-",
          ]
          tagStatus = "tagged"
        }
      }
    ]
  })
  tags = {
    "VantaDescription"      = "Narrator data processing"
    "VantaOwner"            = "ahmed@narrator.ai"
    "service"               = "mavis"
    "VantaNonProd"          = "false"
    "VantaContainsUserData" = "false"
    "VantaUserDataStored"   = "Processes and accesses customer data warehouses and cached data"
  }
}
