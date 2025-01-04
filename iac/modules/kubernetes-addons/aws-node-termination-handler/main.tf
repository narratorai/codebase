locals {
  namespace       = "kube-system"
  name            = "aws-node-termination-handler"
  service_account = "${local.name}-sa"

  argocd_gitops_config = {
    enable             = true
    serviceAccountName = local.service_account
    queueURL           = aws_sqs_queue.aws_node_termination_handler_queue.url
  }

  irsa_config = {
    kubernetes_namespace                = local.namespace
    kubernetes_service_account          = local.service_account
    create_kubernetes_namespace         = false
    create_kubernetes_service_account   = true
    create_service_account_secret_token = false
    irsa_iam_policies                   = concat([aws_iam_policy.aws_node_termination_handler_irsa.arn], var.irsa_policies)
  }

  event_rules = flatten([
    length(var.autoscaling_group_names) > 0 ?
    [{
      name          = substr("NTHASGTermRule-${var.addon_context.eks_cluster_id}", 0, 63),
      event_pattern = <<EOF
{"source":["aws.autoscaling"],"detail-type":["EC2 Instance-terminate Lifecycle Action"]}
EOF
    }] : [],
    {
      name          = substr("NTHSpotTermRule-${var.addon_context.eks_cluster_id}", 0, 63),
      event_pattern = <<EOF
{"source": ["aws.ec2"],"detail-type": ["EC2 Spot Instance Interruption Warning"]}
EOF
    },
    {
      name          = substr("NTHRebalanceRule-${var.addon_context.eks_cluster_id}", 0, 63),
      event_pattern = <<EOF
{"source": ["aws.ec2"],"detail-type": ["EC2 Instance Rebalance Recommendation"]}
EOF
    },
    {
      name          = substr("NTHInstanceStateChangeRule-${var.addon_context.eks_cluster_id}", 0, 63),
      event_pattern = <<EOF
{"source": ["aws.ec2"],"detail-type": ["EC2 Instance State-change Notification"]}
EOF
    },
    {
      name          = substr("NTHScheduledChangeRule-${var.addon_context.eks_cluster_id}", 0, 63),
      event_pattern = <<EOF
{"source": ["aws.health"],"detail-type": ["AWS Health Event"]}
EOF
    }
  ])
}

resource "aws_autoscaling_lifecycle_hook" "aws_node_termination_handler_hook" {
  count = length(var.autoscaling_group_names)

  name                   = "aws_node_termination_handler_hook"
  autoscaling_group_name = var.autoscaling_group_names[count.index]
  default_result         = "CONTINUE"
  heartbeat_timeout      = 300
  lifecycle_transition   = "autoscaling:EC2_INSTANCE_TERMINATING"
}

resource "aws_autoscaling_group_tag" "aws_node_termination_handler_tag" {
  count = length(var.autoscaling_group_names)

  autoscaling_group_name = var.autoscaling_group_names[count.index]

  tag {
    key   = "aws-node-termination-handler/managed"
    value = "true"

    propagate_at_launch = true
  }
}

resource "aws_sqs_queue" "aws_node_termination_handler_queue" {
  name_prefix               = "aws_node_termination_handler"
  message_retention_seconds = "300"
  sqs_managed_sse_enabled   = true
  tags                      = var.addon_context.tags
}

resource "aws_sqs_queue_policy" "aws_node_termination_handler_queue_policy" {
  queue_url = aws_sqs_queue.aws_node_termination_handler_queue.id
  policy    = data.aws_iam_policy_document.aws_node_termination_handler_queue_policy_document.json
}

resource "aws_cloudwatch_event_rule" "aws_node_termination_handler_rule" {
  count = length(local.event_rules)

  name          = local.event_rules[count.index].name
  event_pattern = local.event_rules[count.index].event_pattern
}

resource "aws_cloudwatch_event_target" "aws_node_termination_handler_rule_target" {
  count = length(aws_cloudwatch_event_rule.aws_node_termination_handler_rule)

  rule = aws_cloudwatch_event_rule.aws_node_termination_handler_rule[count.index].id
  arn  = aws_sqs_queue.aws_node_termination_handler_queue.arn
}

resource "aws_iam_policy" "aws_node_termination_handler_irsa" {
  description = "IAM role policy for AWS Node Termination Handler"
  name        = "${var.addon_context.eks_cluster_id}-aws-nth-irsa"
  policy      = data.aws_iam_policy_document.irsa_policy.json
  tags        = var.addon_context.tags
}