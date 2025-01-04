locals {
  eks_cluster_version  = data.aws_eks_cluster.eks_cluster.version
  # Configuration for managing add-ons via ArgoCD.
  argocd_addon_config = {
    argoRollouts              = var.enable_argo_rollout ? module.argo_rollout[0].argocd_gitops_config : null
    argoWorkflows             = var.enable_argo_workflow ? module.argo_workflow[0].argocd_gitops_config : null
    argocdImageUpdater        = var.enable_argocd_image_updater ? module.argocd_image_updater[0].argocd_gitops_config : null
    awsCloudWatchMetrics      = var.enable_aws_cloudwatch_metrics ? module.aws_cloudwatch_metrics[0].argocd_gitops_config : null
    awsLoadBalancerController = var.enable_aws_load_balancer_controller ? module.aws_load_balancer_controller[0].argocd_gitops_config : null
    awsForFluentBit           = var.enable_aws_for_fluentbit ? module.aws_for_fluent_bit[0].argocd_gitops_config : null
    awsNodeTerminationHandler = var.enable_aws_node_termination_handler ? module.aws_node_termination_handler[0].argocd_gitops_config : null
    doppler                   = var.enable_doppler ? module.doppler[0].argocd_gitops_config : null
    externalDns               = var.enable_external_dns ? module.external_dns[0].argocd_gitops_config : null
    externalSecrets           = var.enable_external_secrets ? module.external_secrets[0].argocd_gitops_config : null
    grafana                   = var.enable_grafana ? module.grafana[0].argocd_gitops_config : null
    karpenter                 = var.enable_karpenter ? module.karpenter[0].argocd_gitops_config : null
    k8sMonitoring             = var.enable_k8s_monitoring ? module.k8s_monitoring[0].argocd_gitops_config : null
    metricsServer             = var.enable_metrics_server ? module.metrics_server[0].argocd_gitops_config : null
    prometheus                = var.enable_prometheus ? module.prometheus[0].argocd_gitops_config : null
    reloader                  = var.enable_reloader ? module.reloader[0].argocd_gitops_config : null
    thanos                    = var.enable_thanos ? module.thanos[0].argocd_gitops_config : null
  }

  eks_oidc_issuer_url = replace(data.aws_eks_cluster.eks_cluster.identity[0].oidc[0].issuer, "https://", "")

  addon_context = {
    aws_caller_identity_account_id = data.aws_caller_identity.current.account_id
    aws_caller_identity_arn        = data.aws_caller_identity.current.arn
    aws_eks_cluster_endpoint       = data.aws_eks_cluster.eks_cluster.endpoint
    aws_partition_id               = data.aws_partition.current.partition
    aws_region_name                = data.aws_region.current.name
    eks_cluster_id                 = var.eks_cluster_id
    eks_oidc_issuer_url            = local.eks_oidc_issuer_url
    eks_oidc_provider_arn          = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${local.eks_oidc_issuer_url}"
    irsa_iam_role_path             = var.irsa_iam_role_path
    irsa_iam_permissions_boundary  = var.irsa_iam_permissions_boundary
    tags                           = var.tags
    default_repository             = local.amazon_container_image_registry
  }

  amazon_container_image_registry = "602401143452.dkr.ecr.us-east-1.amazonaws.com/amazon"
}