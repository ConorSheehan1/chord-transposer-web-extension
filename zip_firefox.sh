#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
mkdir -p "$SCRIPT_DIR/dist_zip_firefox"
cd "$SCRIPT_DIR/dist_firefox" && zip -r "../dist_zip_firefox/chord-transposer-firefox.zip" . && echo "zip done"