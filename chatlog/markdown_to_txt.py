#!/usr/bin/env python3
"""
Convert a markdown file to plain text format.

Usage: python markdown_to_txt.py input.md output.txt
"""

import re
import sys
import argparse
from typing import List


def strip_html_tags(text: str) -> str:
    """Remove HTML tags from text."""
    # Remove HTML comments
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    return text


def convert_markdown_links(text: str) -> str:
    """Convert markdown links to plain text."""
    # Convert [text](url) to "text (url)"
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'\1 (\2)', text)
    # Convert [text] reference links to just "text"
    text = re.sub(r'\[([^\]]+)\]\[[^\]]*\]', r'\1', text)
    return text


def convert_markdown_images(text: str) -> str:
    """Convert markdown images to plain text."""
    # Convert ![alt](url) to "[Image: alt]"
    text = re.sub(r'!\[([^\]]*)\]\([^)]+\)', r'[Image: \1]', text)
    return text


def strip_code_fences(text: str) -> str:
    """Remove code fence markers but keep the code content."""
    # Remove code fence markers (``` or ````) with optional language
    text = re.sub(r'^````?\w*\s*$', '', text, flags=re.MULTILINE)
    return text


def convert_headers(text: str) -> str:
    """Convert markdown headers to plain text with underlines."""
    lines = text.split('\n')
    result = []
    
    for line in lines:
        # Match ATX-style headers (# Header)
        header_match = re.match(r'^(#{1,6})\s+(.+)$', line)
        if header_match:
            level = len(header_match.group(1))
            header_text = header_match.group(2)
            
            # Add the header text
            result.append(header_text)
            
            # Add underline for level 1 and 2 headers
            if level == 1:
                result.append('=' * len(header_text))
            elif level == 2:
                result.append('-' * len(header_text))
            
            continue
        
        result.append(line)
    
    return '\n'.join(result)


def convert_emphasis(text: str) -> str:
    """Convert markdown emphasis to plain text."""
    # Convert bold (**text** or __text__) to UPPERCASE
    text = re.sub(r'\*\*([^*]+)\*\*', lambda m: m.group(1).upper(), text)
    text = re.sub(r'__([^_]+)__', lambda m: m.group(1).upper(), text)
    
    # Remove italic markers (*text* or _text_)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'\b_([^_]+)_\b', r'\1', text)
    
    # Remove strikethrough (~~text~~)
    text = re.sub(r'~~([^~]+)~~', r'\1', text)
    
    return text


def convert_lists(text: str) -> str:
    """Normalize markdown lists to plain text."""
    lines = text.split('\n')
    result = []
    
    for line in lines:
        # Convert unordered list markers (-, *, +) to standard bullet
        list_match = re.match(r'^(\s*)[*+-]\s+(.+)$', line)
        if list_match:
            indent = list_match.group(1)
            content = list_match.group(2)
            result.append(f'{indent}• {content}')
            continue
        
        # Keep ordered lists as-is
        result.append(line)
    
    return '\n'.join(result)


def convert_blockquotes(text: str) -> str:
    """Convert markdown blockquotes to indented text."""
    lines = text.split('\n')
    result = []
    
    for line in lines:
        # Remove > prefix from blockquotes
        quote_match = re.match(r'^>\s*(.*)$', line)
        if quote_match:
            content = quote_match.group(1)
            # Indent the content
            result.append(f'  {content}')
            continue
        
        result.append(line)
    
    return '\n'.join(result)


def convert_horizontal_rules(text: str) -> str:
    """Convert markdown horizontal rules to text dividers."""
    # Replace horizontal rules (---, ***, ___) with text divider
    text = re.sub(r'^(\s*[-*_]){3,}\s*$', '-' * 60, text, flags=re.MULTILINE)
    return text


def remove_inline_code(text: str) -> str:
    """Remove backtick markers from inline code."""
    # Remove single backticks
    text = re.sub(r'`([^`]+)`', r'\1', text)
    return text


def clean_whitespace(text: str) -> str:
    """Clean up excessive whitespace."""
    # Remove trailing whitespace from lines
    lines = text.split('\n')
    lines = [line.rstrip() for line in lines]
    
    # Reduce multiple consecutive blank lines to maximum of 2
    result = []
    blank_count = 0
    
    for line in lines:
        if line == '':
            blank_count += 1
            if blank_count <= 2:
                result.append(line)
        else:
            blank_count = 0
            result.append(line)
    
    # Remove trailing blank lines
    while result and result[-1] == '':
        result.pop()
    
    return '\n'.join(result)


def markdown_to_text(markdown_content: str) -> str:
    """Convert markdown content to plain text."""
    text = markdown_content
    
    # Apply conversions in order
    text = strip_html_tags(text)
    text = convert_markdown_images(text)
    text = convert_markdown_links(text)
    text = strip_code_fences(text)
    text = convert_headers(text)
    text = convert_emphasis(text)
    text = remove_inline_code(text)
    text = convert_lists(text)
    text = convert_blockquotes(text)
    text = convert_horizontal_rules(text)
    text = clean_whitespace(text)
    
    return text


def main():
    parser = argparse.ArgumentParser(
        description="Convert a markdown file to plain text format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python markdown_to_txt.py input.md output.txt
  python markdown_to_txt.py chat.md chat.txt
        """
    )
    parser.add_argument('input_file', help='Input markdown file')
    parser.add_argument('output_file', help='Output text file')
    
    args = parser.parse_args()
    
    try:
        # Read the markdown file
        with open(args.input_file, 'r', encoding='utf-8') as f:
            markdown_content = f.read()
        
        # Convert to plain text
        text_content = markdown_to_text(markdown_content)
        
        # Write the text file
        with open(args.output_file, 'w', encoding='utf-8') as f:
            f.write(text_content)
        
        print(f"Successfully converted {args.input_file} to {args.output_file}")
        
    except FileNotFoundError:
        print(f"Error: Could not find input file '{args.input_file}'", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
