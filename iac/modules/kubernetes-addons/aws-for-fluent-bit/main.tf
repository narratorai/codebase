module "irsa" {
  source                            = "../irsa"
  create_kubernetes_namespace       = try(local.irsa_config.create_kubernetes_namespace, true)
  create_kubernetes_service_account = try(local.irsa_config.create_kubernetes_service_account, true)
  kubernetes_namespace              = lookup(local.irsa_config, "kubernetes_namespace", "")
  kubernetes_service_account        = lookup(local.irsa_config, "kubernetes_service_account", "")
  kubernetes_svc_image_pull_secrets = try(local.irsa_config.kubernetes_svc_image_pull_secrets, null)
  irsa_iam_policies                 = lookup(local.irsa_config, "irsa_iam_policies", null)
  irsa_iam_role_path                = lookup(var.addon_context, "irsa_iam_role_path", null)
  irsa_iam_permissions_boundary     = lookup(var.addon_context, "irsa_iam_permissions_boundary", null)
  eks_cluster_id                    = var.addon_context.eks_cluster_id
  eks_oidc_provider_arn             = var.addon_context.eks_oidc_provider_arn
}


resource "aws_cloudwatch_log_group" "aws_for_fluent_bit" {
  count             = var.create_cw_log_group ? 1 : 0
  name              = local.log_group_name
  retention_in_days = var.cw_log_group_retention
  kms_key_id        = var.cw_log_group_kms_key_arn == null ? module.kms[0].key_arn : var.cw_log_group_kms_key_arn
  tags              = var.addon_context.tags
}

resource "aws_iam_policy" "aws_for_fluent_bit" {
  name        = "${var.addon_context.eks_cluster_id}-fluentbit"
  description = "IAM Policy for AWS for FluentBit"
  policy      = data.aws_iam_policy_document.irsa.json
  tags        = var.addon_context.tags
}

module "kms" {
  count       = var.cw_log_group_kms_key_arn == null && var.create_cw_log_group ? 1 : 0
  source      = "../kms"
  description = "EKS Workers FluentBit CloudWatch Log group KMS Key"
  alias       = "alias/${var.addon_context.eks_cluster_id}-cw-fluent-bit"
  policy      = data.aws_iam_policy_document.kms.json
  tags        = var.addon_context.tags
}