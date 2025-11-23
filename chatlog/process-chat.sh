#!/bin/bash

# Process chat log: JSON -> Markdown -> Text -> Character count
# Usage: ./process-chat.sh [input.json]

set -e  # Exit on error

# Get input file (default to chat.json)
INPUT_FILE="${1:-chat.json}"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' not found" >&2
    exit 1
fi

# Extract base name without extension
BASENAME=$(basename "$INPUT_FILE" .json)

# Define output files
MD_FILE="${BASENAME}.md"
TXT_FILE="${BASENAME}.txt"

echo "Processing chat log: $INPUT_FILE"
echo "=================================="

# Step 1: Convert JSON to Markdown
echo "Step 1: Converting JSON to Markdown..."
python3 chat_to_markdown.py "$INPUT_FILE" "$MD_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Created $MD_FILE"
else
    echo "✗ Failed to convert to Markdown" >&2
    exit 1
fi

# Step 2: Convert Markdown to Text
echo ""
echo "Step 2: Converting Markdown to Text..."
python3 markdown_to_txt.py "$MD_FILE" "$TXT_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Created $TXT_FILE"
else
    echo "✗ Failed to convert to Text" >&2
    exit 1
fi

# Step 3: Count characters in text file
echo ""
echo "Step 3: Analyzing text file..."
echo "=================================="

# Count characters (including newlines)
CHAR_COUNT=$(wc -c < "$TXT_FILE" | tr -d ' ')

# Count characters (excluding newlines)
CHAR_NO_NEWLINES=$(tr -d '\n' < "$TXT_FILE" | wc -c | tr -d ' ')

# Count words
WORD_COUNT=$(wc -w < "$TXT_FILE" | tr -d ' ')

# Count lines
LINE_COUNT=$(wc -l < "$TXT_FILE" | tr -d ' ')

# Estimate tokens (rough approximation: ~4 chars per token)
TOKEN_ESTIMATE=$((CHAR_COUNT / 4))

echo "File: $TXT_FILE"
echo "-----------------------------------"
printf "Characters (total):       %'d\n" $CHAR_COUNT
printf "Characters (no newlines): %'d\n" $CHAR_NO_NEWLINES
printf "Words:                    %'d\n" $WORD_COUNT
printf "Lines:                    %'d\n" $LINE_COUNT
printf "Estimated tokens:         %'d\n" $TOKEN_ESTIMATE
echo "=================================="
echo ""
echo "✓ Processing complete!"
echo ""
echo "Generated files:"
echo "  - $MD_FILE (markdown)"
echo "  - $TXT_FILE (plain text)"
