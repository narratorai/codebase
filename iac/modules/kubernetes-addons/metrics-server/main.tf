resource "kubernetes_namespace_v1" "this" {
  count = local.namespace == "kube-system" ? 0 : 1

  metadata {
    name = local.namespace
    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }
}
