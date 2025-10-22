#!/bin/bash
echo "Testing npm start..."
npm start &
PID=$!
sleep 8
kill $PID 2>/dev/null
wait $PID 2>/dev/null
echo "Test complete"
