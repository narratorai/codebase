variable "eks_cluster_id" {
  description = "EKS Cluster ID"
  type        = string
}

variable "hub_cluster_name" {
  description = "Hub Cluster Name"
  type        = string
}

variable "eks_cluster_endpoint" {
  description = "EKS Cluster Endpoint"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "eks_cluster_certificate_authority_data" {
  description = "EKS Cluster Certificate Authority Data"
  type        = string
}
