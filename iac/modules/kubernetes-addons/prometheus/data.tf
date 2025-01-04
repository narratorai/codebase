# ------------------------------------------
# AMP Query Permissions
# ------------------------------------------

data "aws_iam_policy_document" "query" {
  statement {
    effect    = "Allow"
    resources = ["*"]

    actions = [
      "aps:GetLabels",
      "aps:GetMetricMetadata",
      "aps:GetSeries",
      "aps:QueryMetrics",
    ]
  }
}

# ------------------------------------------
# AMP Ingest Permissions
# ------------------------------------------

data "aws_iam_policy_document" "ingest" {
  statement {
    effect    = "Allow"
    resources = ["*"]

    actions = [
      "aps:GetLabels",
      "aps:GetMetricMetadata",
      "aps:GetSeries",
      "aps:RemoteWrite",
    ]
  }
}
