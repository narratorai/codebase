variable "eks_cluster_id" {
  description = "EKS Cluster Id"
  type        = string
}

variable "eks_cluster_domain" {
  description = "The domain for the EKS cluster."
  default     = ""
  type        = string
}

variable "eks_worker_security_group_id" {
  description = "EKS Worker Security group Id created by EKS module"
  default     = ""
  type        = string
}

variable "auto_scaling_group_names" {
  description = "List of self-managed node groups autoscaling group names"
  default     = []
  type        = list(string)
}

variable "argocd_install" {
  description = "Install ArgoCD into the cluster"
  type = bool
  default = true
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Additional tags (e.g. `map('BusinessUnit`,`XYZ`)"
}

variable "irsa_iam_role_path" {
  type        = string
  default     = "/"
  description = "IAM role path for IRSA roles"
}

variable "irsa_iam_permissions_boundary" {
  type        = string
  default     = ""
  description = "IAM permissions boundary for IRSA roles"
}
#####

variable "amazon_eks_aws_ebs_csi_driver_config" {
  description = "configMap for AWS EBS CSI Driver add-on"
  type        = any
  default     = {}
}

variable "enable_amazon_eks_aws_ebs_csi_driver" {
  description = "Enable EKS Managed AWS EBS CSI Driver add-on; enable_amazon_eks_aws_ebs_csi_driver and enable_self_managed_aws_ebs_csi_driver are mutually exclusive"
  type        = bool
  default     = false
}

#-----------ARGOCD ADDON-------------
variable "argocd_helm_config" {
  type        = any
  default     = {}
  description = "Argo CD Kubernetes add-on config"
}

variable "argocd_applications" {
  type        = any
  default     = {}
  description = "Argo CD Applications config to bootstrap the cluster"
}

variable "argocd_projects" {
  description = "Argo CD Project config to bootstrap the cluster"
  type        = any
  default     = {}
}

#-----------AWS NODE TERMINATION HANDLER-------------
variable "enable_aws_node_termination_handler" {
  description = "Enable AWS Node Termination Handler add-on"
  type        = bool
  default     = false
}


variable "aws_node_termination_handler_irsa_policies" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}

#-----------METRIC SERVER-------------
variable "enable_metrics_server" {
  type        = bool
  default     = false
  description = "Enable metrics server add-on"
}

variable "metrics_server_irsa_config" {
  type        = any
  default     = {}
  description = "Metrics Server IRSA config"
}

#-----------AWS LB Ingress Controller-------------
variable "enable_aws_load_balancer_controller" {
  type        = bool
  default     = false
  description = "Enable AWS Load Balancer Controller add-on"
}

variable "aws_load_balancer_controller_irsa_config" {
  type        = any
  description = "AWS Load Balancer Controller IRSA config"
  default     = {}
}

#-----------AWS CloudWatch Metrics-------------
variable "enable_aws_cloudwatch_metrics" {
  description = "Enable AWS CloudWatch Metrics add-on for Container Insights"
  type        = bool
  default     = false
}

variable "aws_cloudwatch_metrics_irsa_config" {
  description = "AWS CloudWatch Metrics IRSA config"
  type        = any
  default     = {}
}

variable "aws_cloudwatch_metrics_irsa_policies" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}

#-----------Doppler ADDON-------------
variable "enable_doppler" {
  description = "Enable Doppler add-on"
  type        = bool
  default     = false
}

variable "doppler_irsa_config" {
  description = "AWS CloudWatch Metrics IRSA config"
  type        = any
  default     = {}
}

#-----------Grafana ADDON-------------
variable "enable_grafana" {
  description = "Enable Grafana add-on"
  type        = bool
  default     = false
}
variable "grafana_irsa_config" {
  description = "Kubernetes Grafana IRSA config"
  type        = any
  default     = null
}

variable "grafana_irsa_policies" {
  description = "IAM policy ARNs for grafana IRSA"
  type        = list(string)
  default     = []
}

#-----------PROMETHEUS-------------
variable "enable_prometheus" {
  description = "Enable Community Prometheus add-on"
  type        = bool
  default     = false
}

variable "prometheus_irsa_config" {
  description = "Community Prometheus IRSA config"
  type        = any
  default     = {}
}

#-----------Amazon Managed Service for Prometheus-------------
variable "enable_amazon_prometheus" {
  description = "Enable AWS Managed Prometheus service"
  type        = bool
  default     = false
}

variable "amazon_prometheus_workspace_endpoint" {
  description = "AWS Managed Prometheus WorkSpace Endpoint"
  type        = string
  default     = null
}

variable "amazon_prometheus_workspace_region" {
  description = "AWS Managed Prometheus WorkSpace Region"
  type        = string
  default     = null
}

#-----------External DNS ADDON-------------
variable "enable_external_dns" {
  description = "External DNS add-on"
  type        = bool
  default     = false
}

variable "external_dns_irsa_policies" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}

variable "external_dns_route53_zone_arns" {
  description = "List of Route53 zones ARNs which external-dns will have access to create/manage records"
  type        = list(string)
  default     = []
}

variable "zone_id_filter" {
  description = "Zone ID filter"
  type        = string
  default     = ""
}
#-----------EXTERNAL SECRETS OPERATOR-----------
variable "enable_external_secrets" {
  type        = bool
  default     = false
  description = "Enable External Secrets operator add-on"
}


variable "external_secrets_irsa_policies" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}

variable "external_secrets_ssm_parameter_arns" {
  description = "List of Systems Manager Parameter ARNs that contain secrets to mount using External Secrets"
  type        = list(string)
  default     = ["arn:aws:ssm:*:*:parameter/*"]
}

variable "external_secrets_secrets_manager_arns" {
  description = "List of Secrets Manager ARNs that contain secrets to mount using External Secrets"
  type        = list(string)
  default     = ["arn:aws:secretsmanager:*:*:secret:*"]
}


#-----------KARPENTER ADDON-------------
variable "enable_karpenter" {
  description = "Enable Karpenter autoscaler add-on"
  type        = bool
  default     = false
}

variable "karpenter_helm_config" {
  description = "Karpenter autoscaler add-on config"
  type        = any
  default     = {}
}

variable "karpenter_irsa_policies" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}

variable "karpenter_node_iam_instance_profile" {
  description = "Karpenter Node IAM Instance profile id"
  type        = string
  default     = ""
}

variable "karpenter_enable_spot_termination_handling" {
  description = "Determines whether to enable native spot termination handling"
  type        = bool
  default     = false
}

variable "sqs_queue_managed_sse_enabled" {
  description = "Enable server-side encryption (SSE) for a SQS queue"
  type        = bool
  default     = true
}

variable "sqs_queue_kms_master_key_id" {
  description = "The ID of an AWS-managed customer master key (CMK) for Amazon SQS or a custom CMK"
  type        = string
  default     = null
}

variable "sqs_queue_kms_data_key_reuse_period_seconds" {
  description = "The length of time, in seconds, for which Amazon SQS can reuse a data key to encrypt or decrypt messages before calling AWS KMS again"
  type        = number
  default     = null
}

#-----------THANOS-------------
variable "enable_thanos" {
  description = "Enable Thanos add-on"
  type        = bool
  default     = false
}

variable "thanos_helm_config" {
  description = "Thanos Helm Chart config"
  type        = any
  default     = {}
}

variable "thanos_irsa_policies" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}

#-----------ARGOCD IMAGE UPDATER -------------
variable "enable_argocd_image_updater" {
  description = "Enable ArgoCD image updater add-on"
  type        = bool
  default     = false
}


variable "argocd_image_updater_irsa_config" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}

#-----------ARGOCD Workflows-------------
variable "enable_argo_workflow" {
  description = "Enable ArgoCD workflow add-on"
  type        = bool
  default     = false
}


variable "argo_workflow_irsa_config" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}

#-----------ARGOCD Rollouts-------------
variable "enable_argo_rollout" {
  description = "Enable ArgoCD rollout add-on"
  type        = bool
  default     = false
}


variable "argo_rollout_irsa_config" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}

#-----------Reloader -------------
variable "enable_reloader" {
  description = "Enable Reloader add-on"
  type        = bool
  default     = false
}

variable "reloader_irsa_config" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}

#-----------FluentBit -------------
variable "enable_aws_for_fluentbit" {
  description = "Enable AWS for FluentBit add-on"
  type        = bool
  default     = false
}

variable "aws_for_fluentbit_irsa_policies" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}

variable "aws_for_fluentbit_create_cw_log_group" {
  description = "Set to false to use existing CloudWatch log group supplied via the cw_log_group_name variable."
  type        = bool
  default     = true
}

variable "aws_for_fluentbit_cw_log_group_name" {
  description = "FluentBit CloudWatch Log group name"
  type        = string
  default     = null
}

variable "aws_for_fluentbit_cw_log_group_retention" {
  description = "FluentBit CloudWatch Log group retention period"
  type        = number
  default     = 90
}

variable "aws_for_fluentbit_cw_log_group_kms_key_arn" {
  description = "FluentBit CloudWatch Log group KMS Key"
  type        = string
  default     = null
}

#-----------K8s Monitoring -------------
variable "enable_k8s_monitoring" {
  description = "Enable k8s Monitoring add-on"
  type        = bool
  default     = false
}

variable "k8s_monitoring_irsa_config" {
  description = "Additional IAM policies for a IAM role for service accounts"
  type        = list(string)
  default     = []
}