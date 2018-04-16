build/up: build up

test: rm build up

build:
	docker-compose build
up:
	docker-compose up
stop:
	docker-compose down
rm:
	docker-compose rm -f
	rm -rf ./middleware/tmp