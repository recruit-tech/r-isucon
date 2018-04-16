output "aws_instance" {
  value = "${aws_instance.management-instance.*.id}"
}

output "aws_eip" {
  value = "${aws_eip.management-eip.*.id}"
}
