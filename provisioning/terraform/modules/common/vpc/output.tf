output "vpc_id" {
  value = "${aws_vpc.r-isucon-vpc.id}"
}

output "security_group_id" {
  value = "${aws_security_group.r-isucon_sg.id}"
}

output "route_table_id" {
  value = "${aws_route_table.r-isucon-public-rt.id}"
}

output "private_zone_id" {
  value = "${aws_route53_zone.private_zone.id}"
}
