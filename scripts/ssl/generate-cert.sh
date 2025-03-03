#!/usr/bin/env bash

# Create a directory to store your SSL files
sudo mkdir -p /root/ssl

# Generate a new private key
openssl genrsa -out /root/ssl/server.key 2048

# Generate a certificate signing request (CSR)
openssl req -new -key /root/ssl/server.key -out /root/ssl/server.csr -subj "/C=IN/ST=Maharashtra/L=Pune/O=Company/OU=Org/CN=data.cropsense.tech"

# Generate a self-signed certificate
openssl x509 -req -days 365 -in /root/ssl/server.csr -signkey /root/ssl/server.key -out /root/ssl/server.crt