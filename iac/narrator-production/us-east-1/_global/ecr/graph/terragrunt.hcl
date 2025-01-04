terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-ecr.git?ref=v1.6.0"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  repository_name                 = "graph"
  repository_image_tag_mutability = "MUTABLE"
  attach_repository_policy = false
  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        action = {
          type = "expire"
        }
        description  = "Cleanup untagged images"
        rulePriority = 1
        selection = {
          countNumber = 3
          countType   = "sinceImagePushed"
          countUnit   = "days"
          tagStatus   = "untagged"
        }
      },
      {
        action = {
          type = "expire"
        }
        description  = "Cleanup nonprod images"
        rulePriority = 2
        selection = {
          countNumber = 20
          countType   = "imageCountMoreThan"
          tagPrefixList = [
            "nonprod",
          ]
          tagStatus = "tagged"
        }
      },
    ]
  })

  # Registry Replication Configuration
  create_registry_replication_configuration = true
  registry_replication_rules = [
    {
      destinations = [{
        region      = "eu-west-1"
        registry_id = "479493230127"
      }]
    }
  ]
  tags = {
    "VantaDescription" = "docker infrastructure for graph service"
    "VantaOwner"       = "ahmed@narrator.ai"
    "service"          = "graph"
    "tier"             = "web"
  }
}