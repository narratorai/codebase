variable "irsa_config" {
  type        = any
  description = "IRSA config for Metrics Server"
  default     = {}
}

variable "addon_context" {
  type = object({
    aws_caller_identity_account_id = string
    aws_caller_identity_arn        = string
    aws_eks_cluster_endpoint       = string
    aws_partition_id               = string
    aws_region_name                = string
    eks_cluster_id                 = string
    eks_oidc_issuer_url            = string
    eks_oidc_provider_arn          = string
  })
  description = "Input configuration for the addon"
}
