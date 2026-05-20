# Copilot Workspace Instructions

## Documentation-First Workflow (Required)

Before answering any user request, first consult the project documentation in `docs/`.

Use this order:
1. Read `docs/ARCHITECTURE.md` first.
2. Then read any app-specific architecture doc relevant to the task:
   - `docs/WEB_ARCHITECTURE.md` for web changes.
   - `docs/DESKTOP_ARCHITECTURE.md` for desktop changes.
   - `docs/SERVER_ARQUITECTURE.md` for server changes.
3. Read `docs/QUALITY.md` when making code changes, running lint/tests, or discussing standards.

If there is a conflict between code and docs, follow docs and mention the conflict in your response. Always prioritize documentation as the source of truth, unless the user tells you otherwise.

## Implementation Rules

- Respect monorepo boundaries and shared library roles described in architecture docs.
- Do not introduce cross-feature imports.
- Keep business rules in domain/shared layers, not UI components.
- Keep all new code, symbols, comments, and docs in English. If previous comments or docs are in another language, modify the existing ones to English.
