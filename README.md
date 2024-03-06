# Zerops hello upload

```yaml
project:
  name: zerops-hello-upload
  tags:
    - zerops
    - hello-upload

services:
  - hostname: api
    type: nodejs@20
    envSecrets:
      DB_HOST: db
      DB_NAME: db
      DB_PASS: ${db_password}
      DB_PORT: "5432"
      DB_USER: ${db_user}
      NODE_ENV: production
      STORAGE_API_URL: ${storage_apiUrl}
      STORAGE_SECRET_KEY: ${storage_secretKey}
      STORAGE_ACCESS_KEY_ID: ${storage_accessKeyId}
      STORAGE_BUCKET_NAME: ${storage_bucketName}
    ports:
      - port: 3000
        httpSupport: true
    enableSubdomainAccess: true
    buildFromGit: https://github.com/fxck/zerops-hello-upload
    minContainers: 1

  - hostname: app
    type: nginx@1.22
    nginxConfig: |-
      server {
          listen 80 default_server;
          listen [::]:80 default_server;

          server_name _;
          root /var/www;

          location / {
              try_files $uri $uri/ /index.html;
          }

          access_log syslog:server=unix:/dev/log,facility=local1 default_short;
          error_log syslog:server=unix:/dev/log,facility=local1;
      }
    enableSubdomainAccess: true
    buildFromGit: https://github.com/fxck/zerops-hello-upload
    minContainers: 1

  - hostname: adminer
    type: php-apache@8.0+2.4
    buildFromGit: https://github.com/zeropsio/recipe-adminer@main
    enableSubdomainAccess: true
    minContainers: 1
    maxContainers: 1

  - hostname: storage
    type: object-storage
    policy: public-read
    objectStorageSize: 2
    priority: 1

  - hostname: db
    type: postgresql@14
    mode: NON_HA
    priority: 1
```
