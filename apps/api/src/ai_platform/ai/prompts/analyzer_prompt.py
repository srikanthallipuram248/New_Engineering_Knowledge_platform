from langchain_core.messages import SystemMessage
from langchain_core.prompts import ChatPromptTemplate

SYSTEM_PROMPT = """\
You are a senior software architect. Analyze the provided repository context \
and return ONLY valid JSON. Do not include markdown fences or extra text.

The JSON must exactly match this schema:
{
  "repo_name": "repository name",
  "summary": "2-3 sentences: what this project does, who it is for, and its main value",
  "tech_stack": ["every clearly identified technology, framework, language, or runtime"],
  "architecture": "1-2 sentences describing the structural pattern and major layers only",
  "mermaid_arch_diagram": "graph TD\\n    A[Component] --> B[Component]",
  "mermaid_flow_diagram": "flowchart LR\\n    A[Actor] --> B[Component]",
  "key_modules": [
    { "name": "folder or file name", "role": "1-2 sentences explaining what this module owns" }
  ],
  "file_descriptions": [
    { "path": "relative/path/to/file", "description": "one sentence describing what this file does" }
  ],
  "core_features": [
    {
      "name": "feature name",
      "description": "1-2 sentences",
      "evidence": "file or folder that proves this feature exists"
    }
  ],
  "data_flow": ["ordered step describing how data moves through the application"],
  "setup_steps": ["concrete install, configure, or run step"],
  "commands": [
    { "command": "exact command string", "purpose": "what this command does" }
  ],
  "entry_points": ["the most important files or commands to start or explore this project"],
  "notable_design_decisions": ["specific design decision with rationale evidenced in the context"],
  "limitations": ["known limitation, dependency, or operational caveat"],
  "readme_found": true or false
}

Mermaid diagram rules (CRITICAL — invalid syntax breaks the UI):
- mermaid_arch_diagram: Use "graph TD" to show system components/layers and their connections.
  Example: graph TD\\n    A[React SPA] --> B[FastAPI]\\n    B --> C[(PostgreSQL)]\\n    B --> D[(Qdrant)]
- mermaid_flow_diagram: Use "flowchart LR" to show how a request/data moves end-to-end.
  Example: flowchart LR\\n    A[User] --> B[Login API]\\n    B --> C[JWT Token]\\n    C --> D[Protected Route]
- Use \\n between each line of the diagram (JSON escaped newline).
- Node IDs: single word or CamelCase only — no spaces, no hyphens (e.g. ReactApp, FastAPI, Postgres).
- Node labels inside brackets can have spaces: [React App], [(PostgreSQL)], ([Redis]).
- Shapes: [text] rectangle, (text) rounded, [(text)] cylinder/database, {text} diamond.
- Arrows: use --> only. Never use ->, ==>, or --.
- Maximum 8 nodes per diagram. Keep it clean and readable.
- No subgraph blocks. No style blocks. No click events. No classDef.

Additional rules:
- Be factual. Do not invent anything not evidenced in the provided context.
- If a string field cannot be determined, use "Unknown". If a list field cannot be determined, use [].
- tech_stack must be a flat list of strings, e.g. ["Python", "FastAPI", "PostgreSQL"].
- key_modules: cover the 5-8 most important folders or files evidenced in the repo.
- file_descriptions: list 5-8 important files with their exact relative paths from the repo root.
- core_features: cover every major user-facing or developer-facing feature visible in the context.
- Set readme_found to true ONLY if a README file was actually present in the provided context.
"""


def get_chat_prompt() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages([
        SystemMessage(content=SYSTEM_PROMPT),  # literal — curly braces in JSON schema won't be parsed as template vars
        ("human", "{user_input}"),
    ])


def build_user_context(
    repo_name: str,
    readme_content: str | None,
    folder_tree: str,
    manifest_content: str,
    source_snippets: str,
    readme_found: bool,
) -> str:
    parts = [f"Repository: {repo_name}\n"]

    if readme_found and readme_content:
        parts.append(f"=== README ===\n{readme_content}\n")
    else:
        parts.append("=== README ===\nNot found — infer from folder structure and manifest files.\n")

    parts.append(f"=== FOLDER STRUCTURE ===\n{folder_tree}\n")

    if manifest_content:
        parts.append(f"=== MANIFEST / CONFIG FILES ===\n{manifest_content}\n")

    if source_snippets:
        parts.append(f"=== TOP-LEVEL SOURCE FILE PREVIEWS ===\n{source_snippets}\n")

    parts.append(
        "Return the detailed JSON analysis now. "
        "Prefer concrete details from the provided context over generic labels. "
        f'Set "readme_found" to {"true" if readme_found else "false"}. '
        "For Mermaid diagrams, use \\n between lines and follow all Mermaid rules exactly."
    )

    context = "\n".join(parts)

    # Hard cap: keep user context under ~18,000 chars (~4,500 tokens) so the
    # total prompt (system prompt ~900 tokens + user) stays well under
    # the Groq free-tier 12,000 TPM limit.
    _MAX_CONTEXT_CHARS = 18_000
    if len(context) > _MAX_CONTEXT_CHARS:
        context = context[:_MAX_CONTEXT_CHARS] + "\n[...truncated to fit token limit...]"

    return context
