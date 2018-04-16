FROM node:9-alpine

RUN apk add --no-cache --virtual .gyp python make g++ imagemagick imagemagick-dev imagemagick-c++ mysql-client

COPY webapps/nodejs /home/node/
COPY webapps/public /home/public/
COPY webapps/uploads /home/uploads/
COPY webapps/sql /home/sql/

WORKDIR /home/node/
RUN pwd
RUN ls -alh
RUN npm install
CMD ["npm","run","start"]
