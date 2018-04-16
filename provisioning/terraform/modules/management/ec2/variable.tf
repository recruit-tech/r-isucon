variable "vpc_id" {}
variable "security_groups_id" {}
variable "route_table_id" {}
variable "public_key" {}
variable "private_zone_id" {}

variable "names" {
  default = {
    "0" = "portal"
    "1" = "worker"
  }
}

variable "instance-type" {
  default = {
    "0" = "m4.xlarge"
    "1" = "m4.xlarge"
  }
}

variable "ami" {
  default = {
    "0" = "ami-aa7e6cd6"
    "1" = "ami-cc8e9db0"
  }
}

variable "domains" {
  default = {
    "0" = "portal"
    "1" = "worker"
  }
}

variable "subnets" {
  default = "10.0.50.0/24"
}
