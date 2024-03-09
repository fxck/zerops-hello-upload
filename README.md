# Zerops hello upload

## NON-HA variant

```yaml
project:
  name: zerops-hello-upload-nonha
  tags:
    - zerops
    - hello-upload
    - nonha

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
      URL: ${zeropsSubdomain}
      STORAGE_PATH: /mnt/sharedstorage
    ports:
      - port: 3000
        httpSupport: true
    enableSubdomainAccess: true
    buildFromGit: https://github.com/fxck/zerops-hello-upload
    minContainers: 1
    mount:
      - sharedstorage
    priority: 10

  - hostname: app
    type: nginx@1.22
    envSecrets:
      API_URL: ${api_zeropsSubdomain}
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
    objectStorageSize: 2
    objectStoragePolicy: public-read
    priority: 15

  - hostname: sharedstorage
    type: shared-storage
    mode: NON_HA
    priority: 15

  - hostname: db
    type: postgresql@14
    mode: NON_HA
    priority: 15
```


## HA variant

```yaml
project:
  name: zerops-hello-upload-ha
  tags:
    - zerops
    - hello-upload
    - ha

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
      STORAGE_SECRET_KEY: ${storage_secretAccessKey}
      STORAGE_ACCESS_KEY_ID: ${storage_accessKeyId}
      STORAGE_BUCKET_NAME: ${storage_bucketName}
      URL: ${zeropsSubdomain}
      STORAGE_PATH: /mnt/sharedstorage
    ports:
      - port: 3000
        httpSupport: true
    enableSubdomainAccess: true
    buildFromGit: https://github.com/fxck/zerops-hello-upload
    minContainers: 2
    maxContainers: 2
    mount:
      - sharedstorage
    priority: 10

  - hostname: app
    type: nginx@1.22
    envSecrets:
      API_URL: ${api_zeropsSubdomain}
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
    minContainers: 2
    maxContainers: 2

  - hostname: adminer
    type: php-apache@8.0+2.4
    buildFromGit: https://github.com/zeropsio/recipe-adminer@main
    enableSubdomainAccess: true
    minContainers: 1
    maxContainers: 1

  - hostname: storage
    type: object-storage
    objectStorageSize: 2
    objectStoragePolicy: public-read
    priority: 15

  - hostname: sharedstorage
    type: shared-storage
    mode: HA
    priority: 15

  - hostname: db
    type: postgresql@14
    mode: HA
    priority: 15
```
