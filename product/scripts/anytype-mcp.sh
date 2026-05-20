#!/bin/bash
# AnyType MCP Wrapper for funcup project
set -x

export ANYTYPE_API_BASE_URL="http://127.0.0.1:31009"
export OPENAPI_MCP_HEADERS="{\"Authorization\":\"Bearer 6aqF9uCFFD4EFKqAbFl96VB56Vh7MVt1eyBbeXHFaIA=\", \"Anytype-Version\":\"2025-11-08\"}"

echo "DEBUG: OPENAPI_MCP_HEADERS=$OPENAPI_MCP_HEADERS" >&2

exec npx -y @anyproto/anytype-mcp "$@"