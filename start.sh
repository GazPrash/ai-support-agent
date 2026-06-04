#!/bin/bash

# Terminate all background processes spawned by this script when it exits (Ctrl+C)
trap "kill 0" EXIT

echo "Starting backend server..."
npm run backend:dev &

echo "Starting frontend server..."
npm run dev &

# Keep script running and wait for background processes
wait
