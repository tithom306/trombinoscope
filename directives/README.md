# Directives (Layer 1)

This directory contains Standard Operating Procedures (SOPs) written in Markdown. These files define the high-level goals, inputs, execution steps (referencing deterministic scripts in `execution/`), expected outputs, and edge cases for various tasks.

## Structure of a Directive

Each directive should follow a clear structure:

1. **Goal**: A high-level description of what the directive achieves.
2. **Inputs**: Any data, parameters, or configurations required.
3. **Execution Steps**: The sequence of steps to perform, specifying which python script in `execution/` to run for each deterministic step.
4. **Outputs**: The expected deliverables (e.g., Cloud sheets, slides, files in `.tmp/`).
5. **Edge Cases & Failure Modes**: Known limitations, rate limits, error handling, and recovery steps.

## Examples of Directives

- `directives/sync_sheet.md` - SOP for syncing local CSV database to Google Sheets.
- `directives/generate_assets.md` - SOP for generating visual assets using AI models and storing them in specific directories.
