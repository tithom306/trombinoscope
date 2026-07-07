# Execution (Layer 3)

This directory contains deterministic Python scripts that perform the actual work (e.g., API requests, data processing, file updates).

## Guidelines for Execution Scripts

1. **Deterministic & Fast**: Avoid probabilistic decisions in scripts. Let the orchestrator (the AI agent) make decisions, and let scripts handle the deterministic execution.
2. **Environment Variables**: Load secrets, API keys, and configurations from the `.env` file at the project root. Do not hardcode secrets.
3. **Robust Error Handling**: Exit with non-zero status codes on failure and print clear, structured error messages/stack traces to stderr.
4. **Console Output**: Log progress and write output parameters or file paths to stdout or `.tmp/` for the orchestrator to read.

## Virtual Environment Setup

It is recommended to use `uv` or `pip` to manage dependencies.
A `requirements.txt` file is placed in this directory to manage external Python libraries.
