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


class AnalyzeRequest(BaseModel):
    git_url: str


class RepoAnalysisResult(BaseModel):
    repo_name: str
    summary: str
    detailed_overview: str
    tech_stack: list[str]
    architecture: str
    key_modules: list[KeyModule]
    core_features: list[Feature]
    data_flow: list[str]
    setup_steps: list[str]
    commands: list[CommandInfo]
    testing: str
    notable_design_decisions: list[str]
    limitations: list[str]
    entry_points: list[str]
    readme_found: bool

    class Config:
        from_attributes = True
