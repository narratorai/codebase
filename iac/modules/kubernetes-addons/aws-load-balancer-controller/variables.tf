variable "irsa_config" {
  type        = any
  description = "IRSA config for the aws_load_balancer_controller."
  default     = {}
}


variable "irsa_iam_role_name" {
  description = "IAM role name for IRSA"
  type        = string
  default     = ""
}


variable "addon_context" {
  description = "Input configuration for the addon."
  type = object({
    aws_caller_identity_account_id = string
    aws_caller_identity_arn        = string
    aws_eks_cluster_endpoint       = string
    aws_partition_id               = string
    aws_region_name                = string
    eks_cluster_id                 = string
    eks_oidc_issuer_url            = string
    eks_oidc_provider_arn          = string
    tags                           = map(string)
    irsa_iam_role_path             = string
    irsa_iam_permissions_boundary  = string
    default_repository             = string
  })
}
