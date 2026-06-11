# FROM python:3.12-slim

# WORKDIR /app

# COPY requirements ./requirements

# #RUN pip install --no-cache-dir -r requirements/base.txt
# RUN pip install --no-cache-dir --timeout 200 --retries 10 -r requirements/base.txt

# COPY . .

# CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]


FROM python:3.12-slim

WORKDIR /app

# Prevent Python from writing .pyc files and enable clean logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Upgrade pip first (important for stability)
RUN pip install --upgrade pip

# Copy only requirements first (better Docker cache)
COPY requirements/base.txt ./requirements/base.txt

# Install dependencies with retry + timeout (fixes your issue)
RUN pip install --no-cache-dir \
    --timeout 200 \
    --retries 10 \
    -r requirements/base.txt

# Copy full project
COPY . .

# Run app
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]