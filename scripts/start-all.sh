#!/bin/bash
echo "Starting all departments..."
echo "Each department runs in a separate terminal tab/tmux pane."
echo ""

DIR="$(dirname "$0")"

if command -v tmux &> /dev/null && [ -n "$TMUX" ]; then
    tmux split-window -h "$DIR/start-engineering.sh"
    tmux split-window -v "$DIR/start-growth.sh"
    tmux select-pane -t 0
    tmux split-window -v "$DIR/start-marketing.sh"
    echo "Started Engineering, Growth, Marketing in tmux panes."
    echo "Run start-seo.sh, start-data.sh, start-automation.sh in additional panes."
else
    echo "Run each department in a separate terminal tab:"
    echo "  Tab 1: $DIR/start-engineering.sh"
    echo "  Tab 2: $DIR/start-marketing.sh"
    echo "  Tab 3: $DIR/start-seo.sh"
    echo "  Tab 4: $DIR/start-automation.sh"
    echo "  Tab 5: $DIR/start-data.sh"
    echo "  Tab 6: $DIR/start-growth.sh"
fi
