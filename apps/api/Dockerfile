<<<<<<< HEAD
=======
# FROM python:3.12-slim

# WORKDIR /app

# COPY requirements ./requirements

# #RUN pip install --no-cache-dir -r requirements/base.txt
# RUN pip install --no-cache-dir --timeout 200 --retries 10 -r requirements/base.txt

# COPY . .

# CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]


>>>>>>> 8e2b753aaa343730bf1b4e714859300776f7fe58
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Required for legacy .doc files
RUN apt-get update && \
    apt-get install -y antiword && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

<<<<<<< HEAD
=======
# Install git (required by gitpython for repo analysis)
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

# Copy only requirements first (better Docker cache)
>>>>>>> 8e2b753aaa343730bf1b4e714859300776f7fe58
COPY requirements/base.txt ./requirements/base.txt

RUN pip install --no-cache-dir \
    --timeout 200 \
    --retries 10 \
    -r requirements/base.txt

COPY . .

<<<<<<< HEAD
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]



=======
# Run app
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
>>>>>>> 8e2b753aaa343730bf1b4e714859300776f7fe58
