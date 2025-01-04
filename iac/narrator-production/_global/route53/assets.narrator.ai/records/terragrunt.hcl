terraform {
  source = "git@github.com:terraform-aws-modules/terraform-aws-route53.git//modules/records?ref=v2.10.2"
}

include "root" {
  path = find_in_parent_folders()
}

inputs = {
  zone_id = "ZRN4BOTNHNV1Z"
  records = [
    {
      name = "assets.narrator.ai"
      type = "CAA"
      ttl  = 300
      records = [
        "0 issue \"amazon.com\"",
        "0 issuewild \"amazon.com\"",
      ]
    },
    {
      name = "assets.narrator.ai"
      type = "NS"
      ttl  = 172800
      records = [
        "ns-1310.awsdns-35.org.",
        "ns-1812.awsdns-34.co.uk.",
        "ns-438.awsdns-54.com.",
        "ns-617.awsdns-13.net.",
      ]
    },
    {
      name = "assets.narrator.ai"
      type = "SOA"
      ttl  = 900
      records = [
        "ns-1310.awsdns-35.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
      ]
    },
    {
      name = "_014ac645631b4ec09fdcc220e8504d4d.assets.narrator.ai"
      type = "CNAME"
      ttl  = 60
      records = [
        "_448e3f6d5573fa196bd41a23a1a451a2.mzlfeqexyx.acm-validations.aws.",
      ]
    }
  ]
}

