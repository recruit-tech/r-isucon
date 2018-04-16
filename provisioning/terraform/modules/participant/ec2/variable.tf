variable "vpc_id" {}
variable "security_groups_id" {}
variable "route_table_id" {}
variable "public_key" {}
variable "private_zone_id" {}

variable "names" {
  default = {
    "0" = "ds-store"
    "1" = "stackoverflow"
    "2" = "top"
  }
}

variable "domains" {
  default = {
    "0" = "ds-store"
    "1" = "stackoverflow"
    "2" = "top"
  }
}

variable "subnets" {
  default = {
    "0" = "10.0.100.0/24"
    "1" = "10.0.101.0/24"
    "2" = "10.0.102.0/24"
  }
}
