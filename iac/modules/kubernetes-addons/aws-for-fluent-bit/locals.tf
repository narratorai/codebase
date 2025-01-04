locals {
  name            = "aws-for-fluent-bit"
  log_group_name  = var.cw_log_group_name == null ? "/${var.addon_context.eks_cluster_id}/worker-fluentbit-logs" : var.cw_log_group_name
  service_account = try(var.helm_config.service_account, "${local.name}-sa")
  namespace       = "kube-system"

  set_values = [
    {
      name  = "serviceAccount.name"
      value = local.service_account
    },
    {
      name  = "serviceAccount.create"
      value = false
    }
  ]

  argocd_gitops_config = {
    enable             = true
    logGroupName       = local.log_group_name
    serviceAccountName = local.service_account
  }

  irsa_config = {
    kubernetes_namespace                = local.namespace
    kubernetes_service_account          = local.service_account
    create_kubernetes_namespace         = false
    create_kubernetes_service_account   = true
    irsa_iam_policies                   = concat([aws_iam_policy.aws_for_fluent_bit.arn], var.irsa_policies)
  }
}