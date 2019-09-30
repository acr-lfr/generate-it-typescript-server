#!/bin/sh

echo "Command: $@"

command="${1:-prod}"

case $command in
  watch)
    npm install
    npm run watch:ts
  ;;
  dev)
    echo "Running dev server..."
    npm run watch:server
  ;;
  prod)
    echo "Running server..."
    npm run start
  ;;
esac
