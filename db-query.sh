#!/bin/bash

# Helper script for querying the Supabase database

# Configuration
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Show usage if no arguments provided
if [ "$#" -eq 0 ]; then
  echo "Usage: ./db-query.sh \"SQL QUERY\" [options]"
  echo ""
  echo "Examples:"
  echo "  ./db-query.sh \"SELECT * FROM public.audit_logs LIMIT 5;\""
  echo "  ./db-query.sh \"\\d public.skills\""
  echo ""
  echo "Options:"
  echo "  --help     Show this help message"
  echo "  --describe TABLE_NAME    Show table structure"
  echo "  --audit    Show recent audit logs"
  exit 0
fi

# Handle special commands
case "$1" in
  "--help")
    echo "Usage: ./db-query.sh \"SQL QUERY\" [options]"
    echo ""
    echo "Examples:"
    echo "  ./db-query.sh \"SELECT * FROM public.audit_logs LIMIT 5;\""
    echo "  ./db-query.sh \"\\d public.skills\""
    echo ""
    echo "Options:"
    echo "  --help     Show this help message"
    echo "  --describe TABLE_NAME    Show table structure"
    echo "  --audit    Show recent audit logs"
    exit 0
    ;;
  "--describe")
    if [ -z "$2" ]; then
      echo "Error: Table name required for --describe"
      exit 1
    fi
    psql -c "\d $2" "$DB_URL"
    exit 0
    ;;
  "--audit")
    psql -c "SELECT id, event_type, entity_type, entity_id, description, event_time, 
             (changes IS NOT NULL) as has_changes
             FROM public.audit_logs 
             ORDER BY event_time DESC LIMIT 10;" "$DB_URL"
    exit 0
    ;;
  *)
    # Execute the provided SQL query
    psql -c "$1" "$DB_URL"
    ;;
esac

exit 0 