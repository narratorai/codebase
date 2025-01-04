terraform {
  source = "git@github.com:umotif-public/terraform-aws-elasticache-redis.git"
}

include "root" {
  path = find_in_parent_folders()
}

dependency "vpc" {
  config_path = "../../../../network/vpc/"
}

inputs = {
  name_prefix              = "celery-mavis-prod"
  num_cache_clusters       = 2
  node_type                = "cache.t4g.small"
  cluster_mode_enabled     = false
  multi_az_enabled         = true
  engine_version           = "7.0"
  port                     = 6379
  maintenance_window       = "mon:03:00-mon:04:00"
  snapshot_window          = "04:00-06:00"
  snapshot_retention_limit = 7

  automatic_failover_enabled = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  apply_immediately          = true
  family                     = "redis7"
  description                = "Elasticache redis mavis celery"

  subnet_ids = dependency.vpc.outputs.private_subnets
  vpc_id     = dependency.vpc.outputs.vpc_id

  ingress_cidr_blocks = dependency.vpc.outputs.private_subnets_cidr_blocks
}



