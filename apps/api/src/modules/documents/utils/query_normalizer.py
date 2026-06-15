import re

def normalize_query(query: str) -> str:

    if not query:
        return ""

    query = query.strip().lower()

    query = query.replace("™", "")
    query = query.replace("®", "")

    query = re.sub(
        r"[^a-z0-9\s._-]",
        " ",
        query
    )

    query = re.sub(
        r"\s+",
        " ",
        query
    )

    return query.strip()




