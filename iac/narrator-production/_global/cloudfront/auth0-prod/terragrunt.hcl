terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-cloudfront.git?ref=v3.2.0"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  aliases                       = ["auth.narrator.ai"]
  create_origin_access_identity = false

  comment             = "Auth0 Custom Domain Reverse Proxy (auth.narrator.ai)"
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  retain_on_delete    = false
  http_version        = "http2and3"
  default_root_object = "index.html"

  origin_access_identities = {
    s3_bucket_one = "Assets S3 Access"
  }

  origin = {
    one = {
      domain_name         = "narrator-cd-Tnm5UzZxCDJov22P.edge.tenants.auth0.com"
      origin_id           = "origin1"
      connection_attempts = 3
      connection_timeout  = 10
      custom_origin_config = {
        http_port                = 80
        https_port               = 443
        origin_keepalive_timeout = 5
        origin_protocol_policy   = "https-only"
        origin_read_timeout      = 30
        origin_ssl_protocols     = ["TLSv1.2"]
      }

      custom_header = [{
        name  = "cname-api-key"
        value = "bfc4f2fc7847f7afe0eab8075fbe974f060a96575d69abb4346e84932c744899"
      }]
    }
  }

  logging_config = {
    bucket          = "auth-infra-production-authproxylogs0b151c62-19ikfzytxfr0z.s3.us-east-1.amazonaws.com"
    include_cookies = false
  }


  default_cache_behavior = {
    target_origin_id       = "origin1"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS", "DELETE", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]
    compress        = true
    query_string    = true


    use_forwarded_values = true
    cookies_forward      = "all"
    headers = [
      "Accept",
      "Authorization",
      "Origin",
      "Referer",
      "User-Agent",
    ]
  }


  viewer_certificate = {
    acm_certificate_arn      = "arn:aws:acm:us-east-1:479493230127:certificate/28bc3a73-3beb-42c7-8fc4-44e073be799a"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

}

