resource "kubernetes_namespace_v1" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

module "aws_ebs_csi_driver" {
  source = "./aws-ebs-csi-driver"

  count = var.enable_amazon_eks_aws_ebs_csi_driver ? 1 : 0

  enable_amazon_eks_aws_ebs_csi_driver = var.enable_amazon_eks_aws_ebs_csi_driver

  addon_config = merge(
    {
      kubernetes_version = local.eks_cluster_version
    },
    var.amazon_eks_aws_ebs_csi_driver_config,
  )

  addon_context = local.addon_context
}

module "argocd" {
  source = "./argocd"

  providers = {
    helm       = helm.hub
    kubernetes = kubernetes.hub
  }

  helm_config    = var.argocd_helm_config
  applications   = var.argocd_applications
  addon_config   = { for k, v in local.argocd_addon_config : k => v if v != null }
  argocd_install = var.argocd_install
  addon_context  = local.addon_context
}

module "argo_rollout" {
  count         = var.enable_argo_rollout ? 1 : 0
  source        = "./argo-rollout"
  irsa_config   = var.argo_rollout_irsa_config
  addon_context = local.addon_context
}

module "argo_workflow" {
  count         = var.enable_argo_workflow ? 1 : 0
  source        = "./argo-workflow"
  irsa_config   = var.argo_workflow_irsa_config
  addon_context = local.addon_context
}

module "argocd_image_updater" {
  count         = var.enable_argocd_image_updater ? 1 : 0
  source        = "./argocd-image-updater"
  irsa_config   = var.argocd_image_updater_irsa_config
  addon_context = local.addon_context
}

module "aws_load_balancer_controller" {
  count         = var.enable_aws_load_balancer_controller ? 1 : 0
  source        = "./aws-load-balancer-controller"
  irsa_config   = var.aws_load_balancer_controller_irsa_config
  addon_context = local.addon_context
}

module "aws_cloudwatch_metrics" {
  count         = var.enable_aws_cloudwatch_metrics ? 1 : 0
  source        = "./aws-cloudwatch-metrics"
  irsa_config   = var.aws_cloudwatch_metrics_irsa_config
  irsa_policies = var.aws_cloudwatch_metrics_irsa_policies
  addon_context = local.addon_context
}

module "aws_for_fluent_bit" {
  count                    = var.enable_aws_for_fluentbit ? 1 : 0
  source                   = "./aws-for-fluent-bit"
  irsa_policies            = var.aws_for_fluentbit_irsa_policies
  create_cw_log_group      = var.aws_for_fluentbit_create_cw_log_group
  cw_log_group_name        = var.aws_for_fluentbit_cw_log_group_name
  cw_log_group_retention   = var.aws_for_fluentbit_cw_log_group_retention
  cw_log_group_kms_key_arn = var.aws_for_fluentbit_cw_log_group_kms_key_arn
  addon_context            = local.addon_context
}

module "aws_node_termination_handler" {
  count                   = var.enable_aws_node_termination_handler && (length(var.auto_scaling_group_names) > 0 || var.enable_karpenter) ? 1 : 0
  source                  = "./aws-node-termination-handler"
  irsa_policies           = var.aws_node_termination_handler_irsa_policies
  autoscaling_group_names = var.auto_scaling_group_names
  addon_context           = local.addon_context
}

module "doppler" {
  count         = var.enable_doppler ? 1 : 0
  source        = "./doppler"
  irsa_config   = var.doppler_irsa_config
  addon_context = local.addon_context
}

module "external_dns" {
  count             = var.enable_external_dns ? 1 : 0
  source            = "./external-dns"
  irsa_policies     = var.external_dns_irsa_policies
  addon_context     = local.addon_context
  route53_zone_arns = var.external_dns_route53_zone_arns
  zone_id_filter    = var.zone_id_filter
}

module "external_secrets" {
  source                                = "./external-secrets"
  count                                 = var.enable_external_secrets ? 1 : 0
  addon_context                         = local.addon_context
  irsa_policies                         = var.external_secrets_irsa_policies
  external_secrets_ssm_parameter_arns   = var.external_secrets_ssm_parameter_arns
  external_secrets_secrets_manager_arns = var.external_secrets_secrets_manager_arns
}

module "grafana" {
  count         = var.enable_grafana ? 1 : 0
  source        = "./grafana"
  irsa_config   = var.grafana_irsa_config
  irsa_policies = var.grafana_irsa_policies
  addon_context = local.addon_context
}

module "karpenter" {
  count                                       = var.enable_karpenter ? 1 : 0
  source                                      = "./karpenter"
  irsa_policies                               = var.karpenter_irsa_policies
  node_iam_instance_profile                   = var.karpenter_node_iam_instance_profile
  enable_spot_termination                     = var.karpenter_enable_spot_termination_handling
  addon_context                               = local.addon_context
  sqs_queue_managed_sse_enabled               = var.sqs_queue_managed_sse_enabled
  sqs_queue_kms_master_key_id                 = var.sqs_queue_kms_master_key_id
  sqs_queue_kms_data_key_reuse_period_seconds = var.sqs_queue_kms_data_key_reuse_period_seconds
}

module "k8s_monitoring" {
  count         = var.enable_k8s_monitoring ? 1 : 0
  source        = "./k8s-monitoring"
  irsa_config   = var.k8s_monitoring_irsa_config
  addon_context = local.addon_context
}

module "metrics_server" {
  count         = var.enable_metrics_server ? 1 : 0
  source        = "./metrics-server"
  irsa_config   = var.metrics_server_irsa_config
  addon_context = local.addon_context
}

module "prometheus" {
  count                                = var.enable_prometheus ? 1 : 0
  source                               = "./prometheus"
  irsa_config                          = var.prometheus_irsa_config
  enable_amazon_prometheus             = var.enable_amazon_prometheus
  amazon_prometheus_workspace_endpoint = var.amazon_prometheus_workspace_endpoint
  addon_context                        = local.addon_context
}

module "reloader" {
  count         = var.enable_reloader ? 1 : 0
  source        = "./reloader"
  irsa_config   = var.reloader_irsa_config
  addon_context = local.addon_context
}

module "thanos" {
  count         = var.enable_thanos ? 1 : 0
  source        = "./thanos"
  addon_context = local.addon_context
  irsa_policies = var.thanos_irsa_policies
}
