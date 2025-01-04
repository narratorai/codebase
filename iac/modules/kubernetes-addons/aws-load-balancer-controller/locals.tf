locals {
  name            = "aws-load-balancer-controller"
  namespace       = "kube-system"
  service_account = "${local.name}-sa"

  argocd_gitops_config = {
    enable             = true
    serviceAccountName = local.service_account
  }

  irsa_config = {
    kubernetes_namespace              = local.namespace
    kubernetes_service_account        = local.service_account
    create_kubernetes_namespace       = true
    create_kubernetes_service_account = true
    irsa_iam_policies                 = [aws_iam_policy.aws_load_balancer_controller.arn]
  }
}