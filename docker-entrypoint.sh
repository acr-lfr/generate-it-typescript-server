#!/bin/sh

# if any errors occur, abort with erorr code
# this will prevent restart loops if any command fails
set -e

echo "Command: $@"

command="${1:-prod}"

case $command in
  watch)
    NODE_ENV=development
    npm install
    npm run dev:build-watch
  ;;
  dev)
    NODE_ENV=development
    echo "Running dev server..."
    npm run start
  ;;
  prod)
    NODE_ENV=production
    echo "Running server..."
    npm run start
  ;;
esac
