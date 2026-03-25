
#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Input variables from the function call
INPUT_FILE="$1"
OUTPUT_FILE="$2"
GS_SETTINGS="$3"

# Log the command that will be executed
echo "Executing Ghostscript command:"
echo "gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 ${GS_SETTINGS} -dNOPAUSE -dQUIET -dBATCH -sOutputFile=\"${OUTPUT_FILE}\" \"${INPUT_FILE}\""

# Execute the Ghostscript command
# The command is intentionally not quoted to allow GS_SETTINGS to expand properly.
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 ${GS_SETTINGS} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${OUTPUT_FILE}" "${INPUT_FILE}"

echo "Ghostscript command completed successfully."
