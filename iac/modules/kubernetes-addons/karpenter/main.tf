module "irsa" {
  source                            = "../irsa"
  create_kubernetes_namespace       = try(local.irsa_config.create_kubernetes_namespace, true)
  create_kubernetes_service_account = try(local.irsa_config.create_kubernetes_service_account, true)
  kubernetes_namespace              = lookup(local.irsa_config, "kubernetes_namespace", "")
  kubernetes_service_account        = lookup(local.irsa_config, "kubernetes_service_account", "")
  kubernetes_svc_image_pull_secrets = try(local.irsa_config.kubernetes_svc_image_pull_secrets, null)
  irsa_iam_policies                 = lookup(local.irsa_config, "irsa_iam_policies", null)
  irsa_iam_role_name                = var.irsa_iam_role_name
  irsa_iam_role_path                = lookup(var.addon_context, "irsa_iam_role_path", null)
  irsa_iam_permissions_boundary     = lookup(var.addon_context, "irsa_iam_permissions_boundary", null)
  eks_cluster_id                    = var.addon_context.eks_cluster_id
  eks_oidc_provider_arn             = var.addon_context.eks_oidc_provider_arn
}

resource "aws_iam_policy" "karpenter" {
  name        = "${var.addon_context.eks_cluster_id}-karpenter"
  description = "IAM Policy for Karpenter"
  policy      = data.aws_iam_policy_document.karpenter.json
  path        = var.path
}

#tfsec:ignore:aws-sqs-enable-queue-encryption
resource "aws_sqs_queue" "this" {
  count = var.enable_spot_termination ? 1 : 0

  name                              = "karpenter-${var.addon_context.eks_cluster_id}"
  message_retention_seconds         = 300
  sqs_managed_sse_enabled           = var.sqs_queue_managed_sse_enabled
  kms_master_key_id                 = var.sqs_queue_kms_master_key_id
  kms_data_key_reuse_period_seconds = var.sqs_queue_kms_data_key_reuse_period_seconds

  tags = var.addon_context.tags
}

resource "aws_sqs_queue_policy" "this" {
  count = var.enable_spot_termination ? 1 : 0

  queue_url = aws_sqs_queue.this[0].id
  policy    = data.aws_iam_policy_document.sqs_queue[0].json
}

resource "aws_cloudwatch_event_rule" "this" {
  for_each = { for k, v in local.event_rules : k => v if var.enable_spot_termination }

  name          = each.value.name
  description   = each.value.description
  event_pattern = jsonencode(each.value.event_pattern)
  tags = merge(
    { "ClusterName" : var.addon_context.eks_cluster_id },
    var.addon_context.tags,
  )
}

resource "aws_cloudwatch_event_target" "this" {
  for_each = { for k, v in local.event_rules : k => v if var.enable_spot_termination }

  rule      = aws_cloudwatch_event_rule.this[each.key].name
  arn       = aws_sqs_queue.this[0].arn
  target_id = "KarpenterInterruptionQueueTarget"
}