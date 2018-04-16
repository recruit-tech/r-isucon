FROM mysql:5.7

ADD ./webapps/sql/*.sql /docker-entrypoint-initdb.d/
ADD ./middleware/mysql/grant_all.sql /docker-entrypoint-initdb.d/

COPY ./middleware/mysql/conf.d/my.cnf /etc/mysql/conf.d/mf.cnf
