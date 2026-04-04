#!/bin/bash
BROWSER="${1:-firefox}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
mkdir -p "$SCRIPT_DIR/../dist_zip"

OUTPUT_FILE="chord-transposer-$BROWSER.zip"
cd "$SCRIPT_DIR/../dist_$BROWSER" && zip -r "../dist_zip/$OUTPUT_FILE" . && echo "created ../dist_zip/$OUTPUT_FILE"