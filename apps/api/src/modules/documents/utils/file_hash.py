import hashlib

def calculate_file_hash(file_path: str):

    sha256 = hashlib.sha256()

    with open(file_path, "rb") as f:

        for chunk in iter(
            lambda: f.read(4096),
            b""
        ):
            sha256.update(chunk)

    return sha256.hexdigest()


def calculate_text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()



