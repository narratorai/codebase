locals {
  name            = "karpenter"
  namespace       = "karpenter"
  service_account = "${local.name}-sa"

  argocd_gitops_config = {
    enable             = true
    serviceAccountName = local.service_account
    controllerClusterEndpoint = var.addon_context.aws_eks_cluster_endpoint
    awsDefaultInstanceProfile = var.node_iam_instance_profile
    awsInterruptionQueueName  = try(aws_sqs_queue.this[0].name, "")
  }

  irsa_config = {
    kubernetes_namespace              = local.namespace
    kubernetes_service_account        = local.service_account
    create_kubernetes_namespace       = true
    create_kubernetes_service_account = true
    irsa_iam_policies                   = concat([aws_iam_policy.karpenter.arn], var.irsa_policies)
  }

  dns_suffix = data.aws_partition.current.dns_suffix

  # Karpenter Spot Interruption Event rules
  event_rules = {
    health_event = {
      name        = "HealthEvent"
      description = "Karpenter Interrupt - AWS health event for EC2"
      event_pattern = {
        source      = ["aws.health"]
        detail-type = ["AWS Health Event"]
        detail = {
          service = ["EC2"]
        }
      }
    }
    spot_interupt = {
      name        = "SpotInterrupt"
      description = "Karpenter Interrupt - A spot interruption warning was triggered for the node"
      event_pattern = {
        source      = ["aws.ec2"]
        detail-type = ["EC2 Spot Instance Interruption Warning"]
      }
    }
    instance_rebalance = {
      name        = "InstanceRebalance"
      description = "Karpenter Interrupt - A spot rebalance recommendation was triggered for the node"
      event_pattern = {
        source      = ["aws.ec2"]
        detail-type = ["EC2 Instance Rebalance Recommendation"]
      }
    }
    instance_state_change = {
      name        = "InstanceStateChange"
      description = "Karpenter interrupt - EC2 instance state-change notification"
      event_pattern = {
        source      = ["aws.ec2"]
        detail-type = ["EC2 Instance State-change Notification"]
        detail = {
          state = ["stopping", "terminated", "shutting-down", "stopped"] #ignored pending and running
        }
      }
    }
  }
}