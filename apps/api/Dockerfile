FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Required packages
RUN apt-get update && \
    apt-get install -y \
        git \
        antiword && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

COPY requirements/base.txt ./requirements/base.txt

RUN pip install --no-cache-dir \
    --timeout 1000 \
    --retries 20 \
    -r requirements/base.txt

COPY . .

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]