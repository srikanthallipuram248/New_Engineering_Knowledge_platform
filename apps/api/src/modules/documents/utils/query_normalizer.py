import re

def normalize_query(query: str) -> str:
    query = query.lower()

    query = re.sub(
        r"[^\w\s]",
        "",
        query
    )

    query = re.sub(
        r"\s+",
        " ",
        query
    )

    return query.strip()