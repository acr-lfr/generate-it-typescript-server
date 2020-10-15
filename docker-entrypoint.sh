#!/bin/sh

# if any errors occur, abort with erorr code
# this will prevent restart loops if any command fails
set -e

echo "Command: $@"

command="${1:-prod}"

case $command in
  watch)
    npm install
    npm run dev:build-watch
  ;;
  dev)
    echo "Running dev server..."
    npm run dev:start-watch
  ;;
  prod)
    echo "Running server..."
    npm run start
  ;;
esac
