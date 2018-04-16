output "aws_instance" {
  value = "${aws_instance.participant-instance.*.id}"
}

output "aws_eip" {
  value = "${aws_eip.participant-eip.*.id}"
}
