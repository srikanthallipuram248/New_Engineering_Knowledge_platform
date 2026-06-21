import tempfile
from dataclasses import dataclass, field
from pathlib import Path

import git

_SKIP_DIRS: frozenset[str] = frozenset({
    ".git", "node_modules", "__pycache__", "dist", "build",
    ".next", ".nuxt", "venv", ".venv", ".env", "vendor",
    "target", "out", ".gradle", ".idea", ".vscode",
})

_SKIP_EXTENSIONS: frozenset[str] = frozenset({
    ".lock", ".pyc", ".class", ".o", ".so", ".dll", ".exe",
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
    ".woff", ".woff2", ".ttf", ".eot", ".pdf",
    ".zip", ".tar", ".gz", ".bin", ".dat",
})

_README_NAMES: frozenset[str] = frozenset({
    "readme.md", "readme.rst", "readme.txt", "readme",
})

_MANIFEST_NAMES: frozenset[str] = frozenset({
    "package.json", "pyproject.toml", "requirements.txt",
    "go.mod", "pom.xml", "cargo.toml", "composer.json",
    "gemfile", "build.gradle", "setup.py", "setup.cfg",
    "dockerfile", "docker-compose.yml",
})

_SOURCE_EXTENSIONS: frozenset[str] = frozenset({
    ".py", ".js", ".ts", ".jsx", ".tsx",
    ".go", ".java", ".rs", ".rb", ".php", ".cs",
})

# Broader than _SOURCE_EXTENSIONS — also worth indexing for chat Q&A
# (config/markup files often answer "how is X configured" questions).
_INDEX_EXTENSIONS: frozenset[str] = _SOURCE_EXTENSIONS | frozenset({
    ".css", ".scss", ".md", ".json", ".yml", ".yaml", ".sql",
})

_README_CHAR_LIMIT = 24_000
_MANIFEST_CHAR_LIMIT = 2_000
_SOURCE_CHAR_LIMIT = 1_500
_MAX_SOURCE_FILES = 5

# Caps for the full-repo indexing pass — keeps embedding generation fast
# even on huge repos. Plenty for "explain/improve this file" style chat.
_MAX_INDEX_FILES = 300
_INDEX_FILE_CHAR_LIMIT = 4_000


@dataclass
class IndexableFile:
    path: str
    content: str


@dataclass
class RepoContext:
    readme_content: str | None
    folder_tree: str
    manifest_content: str
    source_snippets: str
    readme_found: bool
    repo_name: str = ""
    indexable_files: list[IndexableFile] = field(default_factory=list)


def scan_git_url(url: str) -> RepoContext:
    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            git.Repo.clone_from(
                url,
                tmpdir,
                depth=1,
                single_branch=True,
                no_tags=True,
            )
        except git.exc.GitCommandError as exc:
            raise ValueError(
                f"Could not clone repository. "
                f"Make sure the URL is public and correct. Detail: {exc}"
            ) from exc

        root = Path(tmpdir)
        children = [c for c in root.iterdir() if not c.name.startswith(".")]
        if len(children) == 1 and children[0].is_dir():
            root = children[0]

        repo_name = url.rstrip("/").split("/")[-1].removesuffix(".git")
        return _scan_directory(root, repo_name)


def _scan_directory(root: Path, repo_name: str = "") -> RepoContext:
    readme = _find_readme(root)
    tree = _build_tree(root, max_depth=3)
    manifests = _read_manifests(root)
    snippets = "" if readme else _read_source_snippets(root)
    indexable_files = _collect_indexable_files(root)

    return RepoContext(
        readme_content=readme,
        folder_tree=tree,
        manifest_content=manifests,
        source_snippets=snippets,
        readme_found=readme is not None,
        repo_name=repo_name,
        indexable_files=indexable_files,
    )


def _find_readme(root: Path) -> str | None:
    for item in root.iterdir():
        if item.is_file() and item.name.lower() in _README_NAMES:
            return item.read_text(encoding="utf-8", errors="ignore")[:_README_CHAR_LIMIT]
    return None


def _build_tree(root: Path, max_depth: int = 3) -> str:
    lines: list[str] = [f"{root.name}/"]
    _walk_tree(root, prefix="", depth=0, max_depth=max_depth, lines=lines)
    return "\n".join(lines)


def _walk_tree(
    path: Path,
    prefix: str,
    depth: int,
    max_depth: int,
    lines: list[str],
) -> None:
    if depth >= max_depth:
        return

    try:
        all_items = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
    except PermissionError:
        return

    visible = [
        i for i in all_items
        if not (i.is_dir() and i.name in _SKIP_DIRS)
        and not (i.is_file() and i.suffix.lower() in _SKIP_EXTENSIONS)
    ]

    for idx, item in enumerate(visible):
        is_last = idx == len(visible) - 1
        connector = "└── " if is_last else "├── "
        label = item.name + ("/" if item.is_dir() else "")
        lines.append(f"{prefix}{connector}{label}")

        if item.is_dir():
            extension = "    " if is_last else "│   "
            _walk_tree(item, prefix + extension, depth + 1, max_depth, lines)


def _read_manifests(root: Path) -> str:
    parts: list[str] = []
    for item in root.iterdir():
        if item.is_file() and item.name.lower() in _MANIFEST_NAMES:
            text = item.read_text(encoding="utf-8", errors="ignore")[:_MANIFEST_CHAR_LIMIT]
            parts.append(f"=== {item.name} ===\n{text}")
    return "\n\n".join(parts)


def _read_source_snippets(root: Path) -> str:
    parts: list[str] = []
    count = 0
    for item in sorted(root.iterdir()):
        if (
            item.is_file()
            and item.suffix.lower() in _SOURCE_EXTENSIONS
            and count < _MAX_SOURCE_FILES
        ):
            text = item.read_text(encoding="utf-8", errors="ignore")[:_SOURCE_CHAR_LIMIT]
            parts.append(f"=== {item.name} ===\n{text}")
            count += 1
    return "\n\n".join(parts)


def _collect_indexable_files(root: Path) -> list[IndexableFile]:
    """
    Walk the whole repo (capped) and read source/config files for chat
    indexing. Runs inside the same clone as the rest of the scan, before
    the temp dir is cleaned up — this is the only chance to read them.
    """
    files: list[IndexableFile] = []
    _walk_for_index(root, root, files)
    return files


def _walk_for_index(
    current: Path,
    repo_root: Path,
    files: list[IndexableFile],
) -> None:
    if len(files) >= _MAX_INDEX_FILES:
        return

    try:
        entries = sorted(current.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
    except PermissionError:
        return

    for item in entries:
        if len(files) >= _MAX_INDEX_FILES:
            return

        if item.is_dir():
            if item.name not in _SKIP_DIRS:
                _walk_for_index(item, repo_root, files)
            continue

        if item.suffix.lower() not in _INDEX_EXTENSIONS:
            continue

        text = item.read_text(encoding="utf-8", errors="ignore")[:_INDEX_FILE_CHAR_LIMIT]
        if not text.strip():
            continue

        rel_path = str(item.relative_to(repo_root))
        files.append(IndexableFile(path=rel_path, content=text))
