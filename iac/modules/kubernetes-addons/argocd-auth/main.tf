data "aws_iam_role" "argo_role" {
  name     = "${var.hub_cluster_name}-argocd-hub"
}

data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "AWS"
      identifiers = [data.aws_iam_role.argo_role.arn]
    }
  }
}

resource "aws_iam_role" "spoke_role" {
  name               = var.eks_cluster_id
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

################################################################################
# Create secret in cluster-hub to register in ArgoCD
################################################################################

resource "kubernetes_secret_v1" "spoke_cluster" {
  metadata {
    name      = var.eks_cluster_id
    namespace = "argocd"
    labels = {
      "argocd.argoproj.io/secret-type" : "cluster"
    }
    annotations = {
      "project" : var.project_name
    }
  }
  data = {
    server = var.eks_cluster_endpoint
    name   = var.eks_cluster_id
    config = jsonencode(
      {
        execProviderConfig : {
          apiVersion : "client.authentication.k8s.io/v1beta1",
          command : "argocd-k8s-auth",
          args : [
            "aws",
            "--cluster-name",
            var.eks_cluster_id,
            "--role-arn",
            aws_iam_role.spoke_role.arn
          ],
          env : {
            AWS_REGION : var.aws_region
          }
        },
        tlsClientConfig : {
          insecure : false,
          caData : var.eks_cluster_certificate_authority_data
        }
      }
    )
  }
}