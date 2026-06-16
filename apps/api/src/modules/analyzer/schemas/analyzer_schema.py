from pydantic import BaseModel


class KeyModule(BaseModel):
    name: str
    role: str

    class Config:
        from_attributes = True


class Feature(BaseModel):
    name: str
    description: str
    evidence: str

    class Config:
        from_attributes = True


class CommandInfo(BaseModel):
    command: str
    purpose: str

    class Config:
        from_attributes = True


class FileDescription(BaseModel):
    path: str
    description: str

    class Config:
        from_attributes = True


class AnalyzeRequest(BaseModel):
    git_url: str


class RepoAnalysisResult(BaseModel):
    repo_name: str
    summary: str
    tech_stack: list[str]
    architecture: str
    mermaid_arch_diagram: str
    mermaid_flow_diagram: str
    folder_tree: str = ""           # injected from scan state, not LLM
    key_modules: list[KeyModule]
    file_descriptions: list[FileDescription]
    core_features: list[Feature]
    data_flow: list[str]
    setup_steps: list[str]
    commands: list[CommandInfo]
    entry_points: list[str]
    notable_design_decisions: list[str]
    limitations: list[str]
    readme_found: bool

    class Config:
        from_attributes = True
