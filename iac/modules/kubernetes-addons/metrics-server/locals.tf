locals {
  name      = "metrics-server"
  namespace = "kube-system"

  argocd_gitops_config = {
    enable = true
  }
}
