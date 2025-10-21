#!/bin/bash

# Fix DATABASE_URL if it has the malformed 'psql ' prefix
if [[ $DATABASE_URL == psql\ \'* ]]; then
  echo "⚠️  Detected malformed DATABASE_URL with 'psql ' prefix"
  # Remove 'psql ' from beginning and ' from end
  export DATABASE_URL=$(echo "$DATABASE_URL" | sed "s/^psql '//; s/'$//")
  echo "✅ Fixed DATABASE_URL"
fi

# Run the command passed as arguments
exec "$@"
