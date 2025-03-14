#!/bin/bash

# Check if .env file exists
if [ -f .env ]; then
  # Source the .env file to set environment variables
  source .env

  # Check if JWT_SECRET is already defined
  if [ -n "$JWT_SECRET" ]; then
    echo "JWT_SECRET is already defined in .env"
    exit 0
  fi
fi

# Check if JWT_SECRET is already defined in the persistent volume
if [ -f /run/secrets/jwt_secret ]; then
  source /run/secrets/jwt_secret

  # Check if JWT_SECRET is already defined
  if [ -n "$JWT_SECRET" ]; then
    echo "JWT_SECRET is already defined in /run/secrets/jwt_secret"
    exit 0
  fi
fi

# If JWT_SECRET is still not defined, generate a new one
JWT_SECRET=$(openssl rand -hex 32)

# Output the secret to the volume
echo "JWT_SECRET=$JWT_SECRET" > /run/secrets/jwt_secret

# Append the secret to .env file
echo "JWT_SECRET=$JWT_SECRET" >> .env

echo "JWT_SECRET generated and saved to /run/secrets/jwt_secret and .env"
