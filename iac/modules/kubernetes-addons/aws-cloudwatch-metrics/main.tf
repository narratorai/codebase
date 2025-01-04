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
