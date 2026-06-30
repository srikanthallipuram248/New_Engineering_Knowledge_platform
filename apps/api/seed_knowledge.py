"""
Seed script: inserts 50 coding knowledge documents into Postgres + Qdrant.
Run inside the API container: python seed_knowledge.py
"""
import hashlib
import uuid
import sys

from src.core.database import SessionLocal
from src.modules.documents.models.document import Document
from src.modules.documents.models.document_chunk import DocumentChunk  # resolve relationship
from src.modules.users.models.user import User  # resolve FK to users table
from src.modules.documents.services.embedding_service import EmbeddingsService
from src.modules.documents.services.vector_store_service import VectorStoreService

# ── 50 coding documents ──────────────────────────────────────────────────────

DOCS = [
    ("Python Decorators", "md", """
# Python Decorators

Decorators are functions that wrap other functions to add behavior.

```python
def log(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Done {func.__name__}")
        return result
    return wrapper

@log
def greet(name):
    print(f"Hello {name}")

greet("Alice")
# Calling greet
# Hello Alice
# Done greet
```

Use `functools.wraps` to preserve the original function metadata:

```python
import functools

def log(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper
```

Common decorator patterns: retry, caching, auth checks, timing.
"""),

    ("Python Async Await", "md", """
# Python Async/Await

Async functions are defined with `async def` and awaited with `await`.

```python
import asyncio

async def fetch_data(url: str) -> str:
    await asyncio.sleep(1)  # simulates I/O
    return f"data from {url}"

async def main():
    result = await fetch_data("https://api.example.com")
    print(result)

asyncio.run(main())
```

Run tasks concurrently with `asyncio.gather`:

```python
async def main():
    results = await asyncio.gather(
        fetch_data("url1"),
        fetch_data("url2"),
        fetch_data("url3"),
    )
    print(results)
```

Use `asyncio.create_task` for background tasks that don't need to be awaited immediately.
"""),

    ("Python Generators", "md", """
# Python Generators

Generators yield values lazily — memory efficient for large sequences.

```python
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

gen = fibonacci()
for _ in range(10):
    print(next(gen))
# 0 1 1 2 3 5 8 13 21 34
```

Generator expressions (like list comprehensions but lazy):

```python
squares = (x**2 for x in range(1000000))  # no memory used yet
first_ten = [next(squares) for _ in range(10)]
```

Use `yield from` to delegate to a sub-generator:

```python
def chain(*iterables):
    for it in iterables:
        yield from it
```
"""),

    ("Python Dataclasses", "md", """
# Python Dataclasses

Dataclasses auto-generate `__init__`, `__repr__`, `__eq__` from field annotations.

```python
from dataclasses import dataclass, field
from typing import List

@dataclass
class User:
    name: str
    email: str
    age: int = 0
    tags: List[str] = field(default_factory=list)

u = User(name="Alice", email="alice@example.com", age=30)
print(u)  # User(name='Alice', email='alice@example.com', age=30, tags=[])
```

Frozen dataclasses (immutable):

```python
@dataclass(frozen=True)
class Point:
    x: float
    y: float

p = Point(1.0, 2.0)
# p.x = 3.0  # raises FrozenInstanceError
```

Use `@dataclass(order=True)` to enable comparison operators.
"""),

    ("Python Type Hints", "md", """
# Python Type Hints

Type hints improve readability and enable static analysis tools.

```python
from typing import Optional, List, Dict, Union, Tuple

def greet(name: str) -> str:
    return f"Hello, {name}"

def find_user(user_id: int) -> Optional[Dict[str, str]]:
    if user_id == 1:
        return {"name": "Alice", "email": "alice@example.com"}
    return None

def process(items: List[Union[int, str]]) -> Tuple[int, ...]:
    return tuple(int(i) for i in items)
```

Python 3.10+ union syntax:

```python
def find(user_id: int) -> dict | None:
    ...
```

Use `TypeVar` for generic functions:

```python
from typing import TypeVar, List
T = TypeVar("T")

def first(items: List[T]) -> T:
    return items[0]
```
"""),

    ("JavaScript Closures", "md", """
# JavaScript Closures

A closure is a function that remembers its outer scope even after the outer function returns.

```javascript
function makeCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,
  };
}

const counter = makeCounter(10);
counter.increment(); // 11
counter.increment(); // 12
counter.decrement(); // 11
```

Common use case — partial application:

```javascript
function multiply(x) {
  return (y) => x * y;
}

const double = multiply(2);
const triple = multiply(3);

double(5); // 10
triple(5); // 15
```

Closures are used in event handlers, module patterns, and memoization.
"""),

    ("JavaScript Promises and Async Await", "md", """
# JavaScript Promises and Async/Await

Promises represent eventual completion (or failure) of an async operation.

```javascript
function fetchUser(id) {
  return fetch(`/api/users/${id}`)
    .then(res => res.json())
    .catch(err => console.error(err));
}
```

Async/await is cleaner syntax on top of Promises:

```javascript
async function fetchUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    const user = await res.json();
    return user;
  } catch (err) {
    console.error(err);
  }
}
```

Run multiple Promises in parallel:

```javascript
async function loadDashboard(userId) {
  const [user, posts, stats] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchStats(userId),
  ]);
  return { user, posts, stats };
}
```
"""),

    ("TypeScript Generics", "md", """
# TypeScript Generics

Generics let you write reusable, type-safe code.

```typescript
function identity<T>(value: T): T {
  return value;
}

identity<string>("hello"); // "hello"
identity<number>(42);       // 42
```

Generic interfaces:

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface User {
  id: number;
  name: string;
}

const response: ApiResponse<User> = {
  data: { id: 1, name: "Alice" },
  status: 200,
  message: "OK",
};
```

Constrained generics:

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```
"""),

    ("React Hooks Guide", "md", """
# React Hooks

Hooks let you use state and other React features in function components.

```jsx
import { useState, useEffect, useCallback } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  return <div>{user?.name}</div>;
}
```

`useCallback` memoizes functions to avoid re-renders:

```jsx
const handleClick = useCallback(() => {
  console.log(userId);
}, [userId]);
```

`useMemo` memoizes expensive computations:

```jsx
const sorted = useMemo(() => items.sort(), [items]);
```

Custom hooks extract reusable logic:

```jsx
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() =>
    JSON.parse(localStorage.getItem(key) ?? JSON.stringify(initial))
  );
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}
```
"""),

    ("FastAPI Tutorial", "md", """
# FastAPI Tutorial

FastAPI is a modern Python web framework for building APIs.

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class UserCreate(BaseModel):
    name: str
    email: str
    age: Optional[int] = None

users_db = {}

@app.post("/users", status_code=201)
def create_user(user: UserCreate):
    user_id = len(users_db) + 1
    users_db[user_id] = user.dict()
    return {"id": user_id, **user.dict()}

@app.get("/users/{user_id}")
def get_user(user_id: int):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]
```

Dependency injection:

```python
def get_current_user(token: str = Header(...)):
    if token != "secret":
        raise HTTPException(status_code=401)
    return {"id": 1, "name": "Alice"}

@app.get("/me")
def me(user = Depends(get_current_user)):
    return user
```
"""),

    ("PostgreSQL Queries", "md", """
# PostgreSQL Queries

Essential SQL patterns for PostgreSQL.

```sql
-- Create table with constraints
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert
INSERT INTO users (email, name) VALUES ('alice@example.com', 'Alice');

-- Select with filter and order
SELECT id, name, email FROM users
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;

-- Join
SELECT u.name, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
GROUP BY u.id, u.name
HAVING COUNT(p.id) > 0;

-- Update
UPDATE users SET name = 'Bob' WHERE id = 1;

-- Upsert
INSERT INTO users (email, name)
VALUES ('alice@example.com', 'Alice Updated')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
```
"""),

    ("Redis Caching Patterns", "md", """
# Redis Caching Patterns

Redis is an in-memory key-value store used for caching, sessions, and queues.

```python
import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0)

# Cache-aside pattern
def get_user(user_id: int):
    cache_key = f"user:{user_id}"
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
    user = db.query_user(user_id)  # DB call
    r.setex(cache_key, 3600, json.dumps(user))  # cache for 1 hour
    return user

# Counter
r.incr("page_views")
r.incrby("page_views", 10)

# Set operations
r.sadd("online_users", "user:1", "user:2")
r.smembers("online_users")  # {'user:1', 'user:2'}

# Sorted set (leaderboard)
r.zadd("scores", {"alice": 100, "bob": 200})
r.zrevrange("scores", 0, -1, withscores=True)
# [('bob', 200.0), ('alice', 100.0)]
```

Use `redis.ConnectionPool` in production to reuse connections.
"""),

    ("Redis with Node.js", "md", """
# Redis with Node.js

Using Redis in a Node.js/Express application.

```javascript
const { createClient } = require('redis');

const client = createClient({ url: 'redis://localhost:6379' });
client.connect();

// Cache middleware
async function cache(req, res, next) {
  const key = `cache:${req.url}`;
  const cached = await client.get(key);
  if (cached) return res.json(JSON.parse(cached));
  res.sendResponse = res.json.bind(res);
  res.json = (body) => {
    client.setEx(key, 60, JSON.stringify(body));
    res.sendResponse(body);
  };
  next();
}

app.get('/users', cache, async (req, res) => {
  const users = await db.getUsers();
  res.json(users);
});

// Rate limiting
async function rateLimit(req, res, next) {
  const key = `rate:${req.ip}`;
  const count = await client.incr(key);
  if (count === 1) await client.expire(key, 60);
  if (count > 100) return res.status(429).json({ error: 'Too many requests' });
  next();
}
```
"""),

    ("Docker Basics", "md", """
# Docker Basics

Docker packages applications into containers — consistent across environments.

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Common Docker commands:

```bash
docker build -t myapp .
docker run -p 8000:8000 myapp
docker ps                    # list running containers
docker logs <container_id>
docker exec -it <id> bash    # shell into container
docker stop <id>
docker rm <id>
docker images
docker rmi myapp
```

Multi-stage build (smaller final image):

```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```
"""),

    ("Docker Compose", "md", """
# Docker Compose

Docker Compose orchestrates multi-container applications.

```yaml
# docker-compose.yml
version: '3.9'

services:
  api:
    build: ./apps/api
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/mydb
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./apps/api:/app

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

Commands:

```bash
docker compose up --build    # build and start
docker compose up -d         # start detached
docker compose logs -f api   # follow logs
docker compose restart api   # restart one service
docker compose down          # stop and remove containers
```
"""),

    ("JWT Authentication", "md", """
# JWT Authentication

JWT (JSON Web Token) is used for stateless authentication.

```python
# Python - PyJWT
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(minutes=30),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise Exception("Token expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")
```

Frontend usage:

```javascript
// Store token
localStorage.setItem('token', accessToken);

// Send with requests
fetch('/api/protected', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// Decode payload (no verification - just reading)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload.sub); // user id
```
"""),

    ("REST API Design", "md", """
# REST API Design Best Practices

```
GET    /users          → list all users
POST   /users          → create a user
GET    /users/:id      → get one user
PUT    /users/:id      → replace a user
PATCH  /users/:id      → update fields
DELETE /users/:id      → delete a user

GET    /users/:id/posts → nested resource
```

HTTP status codes:

```
200 OK              - successful GET/PUT/PATCH
201 Created         - successful POST
204 No Content      - successful DELETE
400 Bad Request     - invalid input
401 Unauthorized    - not authenticated
403 Forbidden       - authenticated but no permission
404 Not Found       - resource doesn't exist
422 Unprocessable   - validation error
429 Too Many Requests - rate limited
500 Internal Server Error
```

Response format:

```json
{
  "data": { "id": 1, "name": "Alice" },
  "meta": { "total": 100, "page": 1, "per_page": 10 }
}

// Error
{
  "error": "User not found",
  "code": "USER_NOT_FOUND",
  "status": 404
}
```
"""),

    ("SQL Joins Explained", "md", """
# SQL Joins Explained

```sql
-- Sample tables
-- users: id, name
-- orders: id, user_id, amount

-- INNER JOIN: only matching rows
SELECT u.name, o.amount
FROM users u
INNER JOIN orders o ON o.user_id = u.id;

-- LEFT JOIN: all users, even those with no orders
SELECT u.name, COALESCE(SUM(o.amount), 0) as total
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name;

-- RIGHT JOIN: all orders, even if user deleted
SELECT u.name, o.amount
FROM users u
RIGHT JOIN orders o ON o.user_id = u.id;

-- FULL OUTER JOIN: everything from both tables
SELECT u.name, o.amount
FROM users u
FULL OUTER JOIN orders o ON o.user_id = u.id;

-- Self join: manager hierarchy
SELECT e.name as employee, m.name as manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id;
```
"""),

    ("Database Indexing", "md", """
# Database Indexing

Indexes speed up queries but slow down writes. Use them wisely.

```sql
-- Basic index
CREATE INDEX idx_users_email ON users(email);

-- Unique index (also enforces uniqueness)
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Composite index (order matters)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Partial index (only index rows matching condition)
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- Check existing indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'users';

-- EXPLAIN to see if index is used
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'alice@example.com';
```

Rules of thumb:
- Index columns used in WHERE, JOIN ON, ORDER BY
- Composite index: put high-cardinality or equality columns first
- Don't index columns with few distinct values (booleans, status enums)
- Too many indexes slow down INSERT/UPDATE/DELETE
"""),

    ("Database Transactions", "md", """
# Database Transactions

Transactions ensure atomicity — all or nothing.

```python
# SQLAlchemy
from sqlalchemy.orm import Session

def transfer_funds(db: Session, from_id: int, to_id: int, amount: float):
    try:
        sender = db.get(Account, from_id)
        receiver = db.get(Account, to_id)

        if sender.balance < amount:
            raise ValueError("Insufficient funds")

        sender.balance -= amount
        receiver.balance += amount

        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
```

```sql
-- Raw SQL transaction
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;  -- or ROLLBACK if something fails
```

ACID properties:
- **Atomicity**: all operations succeed or none do
- **Consistency**: DB stays in valid state
- **Isolation**: concurrent transactions don't interfere
- **Durability**: committed data survives crashes
"""),

    ("Python Context Managers", "md", """
# Python Context Managers

Context managers handle setup and teardown automatically (the `with` statement).

```python
# Using built-in context managers
with open("file.txt", "r") as f:
    content = f.read()
# file is automatically closed

# Custom context manager with class
class Timer:
    def __enter__(self):
        import time
        self.start = time.time()
        return self

    def __exit__(self, *args):
        self.elapsed = time.time() - self.start
        print(f"Took {self.elapsed:.2f}s")

with Timer() as t:
    # do something slow
    pass

# Custom context manager with contextlib
from contextlib import contextmanager

@contextmanager
def db_transaction(session):
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise

with db_transaction(db) as session:
    session.add(new_user)
```
"""),

    ("Python List Comprehensions and Map Filter", "md", """
# Python List Comprehensions, Map, Filter

List comprehensions are the Pythonic way to transform sequences.

```python
# List comprehension
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]

# Nested
matrix = [[1,2,3],[4,5,6],[7,8,9]]
flat = [n for row in matrix for n in row]

# Dict comprehension
word_lengths = {word: len(word) for word in ["hello", "world"]}

# Set comprehension
unique_lengths = {len(word) for word in ["hi", "hello", "hey"]}

# Generator expression (lazy)
total = sum(x**2 for x in range(1000000))

# map() — apply function to each element
doubled = list(map(lambda x: x * 2, [1, 2, 3]))

# filter() — keep elements matching condition
positives = list(filter(lambda x: x > 0, [-1, 2, -3, 4]))

# Prefer comprehensions over map/filter for readability:
doubled = [x * 2 for x in [1, 2, 3]]
positives = [x for x in [-1, 2, -3, 4] if x > 0]
```
"""),

    ("Error Handling Patterns", "md", """
# Error Handling Patterns

```python
# Python — specific exceptions first, broad last
def read_config(path: str) -> dict:
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        raise ValueError(f"Config file not found: {path}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in config: {e}")
    except Exception as e:
        raise RuntimeError(f"Unexpected error reading config: {e}") from e

# Custom exceptions
class AppError(Exception):
    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.code = code

class NotFoundError(AppError):
    def __init__(self, resource: str, id: int):
        super().__init__(f"{resource} {id} not found", "NOT_FOUND")
```

```javascript
// JavaScript — async error handling
async function fetchUser(id) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}
```
"""),

    ("Design Patterns Singleton and Factory", "md", """
# Design Patterns: Singleton and Factory

**Singleton** — ensures only one instance exists:

```python
class DatabaseConnection:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.connect()
        return cls._instance

    def connect(self):
        self.connection = create_engine("postgresql://...")

db = DatabaseConnection()  # always same instance
```

**Factory** — creates objects without specifying the exact class:

```python
class NotificationFactory:
    @staticmethod
    def create(channel: str):
        if channel == "email":
            return EmailNotification()
        elif channel == "sms":
            return SMSNotification()
        elif channel == "push":
            return PushNotification()
        raise ValueError(f"Unknown channel: {channel}")

notifier = NotificationFactory.create("email")
notifier.send("Hello!")
```
"""),

    ("Design Patterns Repository and Strategy", "md", """
# Design Patterns: Repository and Strategy

**Repository** — abstracts data access:

```python
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    def find_by_id(self, user_id: int): ...
    @abstractmethod
    def save(self, user): ...

class PostgresUserRepository(UserRepository):
    def find_by_id(self, user_id: int):
        return db.query(User).get(user_id)
    def save(self, user):
        db.add(user)
        db.commit()

class InMemoryUserRepository(UserRepository):  # for tests
    def __init__(self):
        self._store = {}
    def find_by_id(self, user_id):
        return self._store.get(user_id)
    def save(self, user):
        self._store[user.id] = user
```

**Strategy** — swap algorithms at runtime:

```python
class Sorter:
    def __init__(self, strategy):
        self.strategy = strategy

    def sort(self, data):
        return self.strategy(data)

sorter = Sorter(sorted)
sorter.sort([3, 1, 2])

sorter.strategy = lambda d: sorted(d, reverse=True)
sorter.sort([3, 1, 2])
```
"""),

    ("Git Workflow and Best Practices", "md", """
# Git Workflow Best Practices

```bash
# Feature branch workflow
git checkout main
git pull origin main
git checkout -b feature/user-auth

# Make commits
git add src/auth.py
git commit -m "feat(auth): add JWT token generation"

# Keep branch up to date
git fetch origin
git rebase origin/main

# Push and open PR
git push origin feature/user-auth
gh pr create --title "Add JWT authentication" --body "..."

# After PR is merged — clean up
git checkout main
git pull origin main
git branch -d feature/user-auth
```

Commit message conventions:

```
feat(scope): add new feature
fix(scope): fix a bug
refactor(scope): restructure without behavior change
docs: update README
test: add unit tests
chore: update dependencies
```

Use `git stash` to temporarily save work:

```bash
git stash
git checkout other-branch
git stash pop
```
"""),

    ("GitHub Actions CI CD", "md", """
# GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: --health-cmd pg_isready

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        run: pytest --cov=src tests/
        env:
          DATABASE_URL: postgresql://postgres:test@localhost/test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
```
"""),

    ("Testing Best Practices Python", "md", """
# Testing Best Practices in Python

```python
# pytest — basic test
def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0

# Fixtures — reusable setup
import pytest
from sqlalchemy import create_engine

@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = Session(engine)
    yield session
    session.close()

def test_create_user(db):
    user = User(name="Alice", email="alice@test.com")
    db.add(user)
    db.commit()
    assert db.get(User, user.id).name == "Alice"

# Parametrize — multiple test cases
@pytest.mark.parametrize("input,expected", [
    ("hello", 5),
    ("world", 5),
    ("hi", 2),
])
def test_strlen(input, expected):
    assert len(input) == expected

# Mocking
from unittest.mock import patch, MagicMock

def test_send_email():
    with patch("myapp.smtp.send") as mock_send:
        send_welcome_email("alice@example.com")
        mock_send.assert_called_once_with(
            to="alice@example.com",
            subject="Welcome!"
        )
```
"""),

    ("Microservices Architecture", "md", """
# Microservices Architecture

Microservices split an application into small, independent services.

```
User Service     → handles auth, profiles
Order Service    → handles orders
Payment Service  → handles billing
Notification Service → emails, SMS

Each service:
- Has its own database
- Communicates via REST API or message queue
- Deploys independently
- Scales independently
```

Inter-service communication:

```python
# Synchronous — HTTP call
import httpx

async def get_user(user_id: int):
    async with httpx.AsyncClient() as client:
        res = await client.get(f"http://user-service/users/{user_id}")
        res.raise_for_status()
        return res.json()

# Asynchronous — message queue (Redis pub/sub)
import redis
r = redis.Redis()

# Publisher
r.publish("order.created", json.dumps({"order_id": 123, "user_id": 1}))

# Subscriber
pubsub = r.pubsub()
pubsub.subscribe("order.created")
for message in pubsub.listen():
    handle_order(json.loads(message["data"]))
```
"""),

    ("WebSockets Guide", "md", """
# WebSockets Guide

WebSockets enable real-time bidirectional communication.

```python
# FastAPI WebSocket server
from fastapi import FastAPI, WebSocket
from typing import List

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, message: str):
        for ws in self.active:
            await ws.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            data = await ws.receive_text()
            await manager.broadcast(f"User: {data}")
    except Exception:
        manager.disconnect(ws)
```

```javascript
// Browser client
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (event) => console.log(event.data);
ws.send('Hello server!');
```
"""),

    ("API Rate Limiting", "md", """
# API Rate Limiting

Protect your API from abuse by limiting request frequency.

```python
# FastAPI + Redis rate limiter
import redis
import time
from fastapi import Request, HTTPException

r = redis.Redis(host='localhost', port=6379)

def rate_limit(max_requests: int = 100, window_seconds: int = 60):
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            client_ip = request.client.host
            key = f"rate:{client_ip}:{func.__name__}"

            pipe = r.pipeline()
            now = time.time()
            pipe.zremrangebyscore(key, 0, now - window_seconds)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, window_seconds)
            _, _, count, _ = pipe.execute()

            if count > max_requests:
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded: {max_requests} requests per {window_seconds}s"
                )
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator

@app.get("/api/data")
@rate_limit(max_requests=10, window_seconds=60)
async def get_data(request: Request):
    return {"data": "..."}
```
"""),

    ("Python Virtual Environments", "md", """
# Python Virtual Environments

Virtual environments isolate project dependencies.

```bash
# Create
python -m venv venv

# Activate
source venv/bin/activate       # Linux/Mac
venv\\Scripts\\activate          # Windows

# Install packages
pip install fastapi uvicorn sqlalchemy

# Save dependencies
pip freeze > requirements.txt

# Install from requirements
pip install -r requirements.txt

# Deactivate
deactivate
```

Using `uv` (much faster modern alternative):

```bash
pip install uv
uv venv
source .venv/bin/activate
uv pip install fastapi uvicorn
uv pip freeze > requirements.txt
```

Using `pyproject.toml` (modern standard):

```toml
[project]
name = "myapp"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.110",
    "uvicorn>=0.29",
    "sqlalchemy>=2.0",
]
```
"""),

    ("Node.js Express Server", "md", """
# Node.js Express Server

```javascript
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email required' });
  }
  const user = await User.create({ name, email });
  res.status(201).json(user);
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```
"""),

    ("Node.js Streams", "md", """
# Node.js Streams

Streams process data piece by piece — memory efficient for large files.

```javascript
const fs = require('fs');
const { Transform } = require('stream');

// Pipe: read → transform → write
const readStream = fs.createReadStream('input.csv');
const writeStream = fs.createWriteStream('output.csv');

const uppercase = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  }
});

readStream.pipe(uppercase).pipe(writeStream);

// HTTP streaming response
app.get('/large-file', (req, res) => {
  const fileStream = fs.createReadStream('./large.json');
  res.setHeader('Content-Type', 'application/json');
  fileStream.pipe(res);
});

// Async iteration (Node 12+)
async function processLines(filePath) {
  const stream = fs.createReadStream(filePath);
  const rl = require('readline').createInterface({ input: stream });
  for await (const line of rl) {
    console.log(line);
  }
}
```
"""),

    ("React State Management with Zustand", "md", """
# React State Management with Zustand

Zustand is a lightweight state management library.

```javascript
import { create } from 'zustand';

// Define store
const useUserStore = create((set, get) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const user = await res.json();
      set({ user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => set({ user: null }),

  isLoggedIn: () => get().user !== null,
}));

// Use in component
function Header() {
  const { user, logout } = useUserStore();
  return (
    <header>
      {user ? (
        <>
          <span>{user.name}</span>
          <button onClick={logout}>Sign out</button>
        </>
      ) : (
        <a href="/login">Sign in</a>
      )}
    </header>
  );
}
```
"""),

    ("React Performance Optimization", "md", """
# React Performance Optimization

```jsx
import { memo, useMemo, useCallback, lazy, Suspense } from 'react';

// memo — skip re-render if props unchanged
const UserCard = memo(({ user, onSelect }) => (
  <div onClick={() => onSelect(user.id)}>{user.name}</div>
));

// useCallback — stable function reference
function UserList({ users }) {
  const handleSelect = useCallback((id) => {
    console.log('selected:', id);
  }, []);  // no dependencies = never changes

  return users.map(u => <UserCard key={u.id} user={u} onSelect={handleSelect} />);
}

// useMemo — expensive computation
function Dashboard({ orders }) {
  const stats = useMemo(() => ({
    total: orders.reduce((s, o) => s + o.amount, 0),
    count: orders.length,
    avg: orders.reduce((s, o) => s + o.amount, 0) / orders.length,
  }), [orders]);

  return <Stats data={stats} />;
}

// Lazy loading — code splitting
const AnalyticsPage = lazy(() => import('./AnalyticsPage'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <AnalyticsPage />
    </Suspense>
  );
}
```
"""),

    ("CSS Grid and Flexbox", "md", """
# CSS Grid and Flexbox

**Flexbox** — one-dimensional layout (row or column):

```css
.container {
  display: flex;
  justify-content: space-between;  /* main axis */
  align-items: center;              /* cross axis */
  gap: 16px;
  flex-wrap: wrap;
}

.item {
  flex: 1;           /* grow to fill space */
  flex: 0 0 200px;   /* fixed 200px, no grow/shrink */
}
```

**Grid** — two-dimensional layout:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* 3 equal columns */
  grid-template-columns: 250px 1fr;       /* sidebar + content */
  gap: 24px;
}

/* Spanning */
.header { grid-column: 1 / -1; }   /* full width */
.sidebar { grid-row: 1 / 3; }      /* span 2 rows */

/* Responsive without media queries */
.grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
```
"""),

    ("Nginx Configuration", "md", """
# Nginx Configuration

```nginx
# /etc/nginx/sites-available/myapp

server {
    listen 80;
    server_name example.com www.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    # Serve React SPA
    location / {
        root /var/www/app/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```
"""),

    ("Load Balancing Concepts", "md", """
# Load Balancing Concepts

Load balancers distribute traffic across multiple servers.

```nginx
# Nginx upstream load balancing
upstream api_servers {
    least_conn;                    # algorithm: least connections
    server api1.example.com:8000;
    server api2.example.com:8000;
    server api3.example.com:8000 backup;  # only used if others fail

    # Round robin (default): requests go 1→2→3→1→2→3
    # Least conn: send to server with fewest active connections
    # IP hash: same client always goes to same server (sticky sessions)
}

server {
    location /api/ {
        proxy_pass http://api_servers;
    }
}
```

Health checks in Docker Compose:

```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

Session stickiness strategies:
- Store sessions in Redis (shared across servers) — preferred
- Sticky sessions via IP hash — avoid if possible
"""),

    ("Event Driven Architecture", "md", """
# Event-Driven Architecture

Services communicate by publishing and subscribing to events.

```python
# Simple event bus with Redis Streams
import redis
import json

r = redis.Redis()

# Publisher
def publish_event(stream: str, event_type: str, data: dict):
    r.xadd(stream, {
        "type": event_type,
        "data": json.dumps(data),
        "timestamp": str(time.time()),
    })

# Usage
publish_event("orders", "order.created", {
    "order_id": 123,
    "user_id": 1,
    "amount": 99.99,
})

# Consumer
def consume_events(stream: str, group: str, consumer: str):
    r.xgroup_create(stream, group, id="0", mkstream=True)
    while True:
        messages = r.xreadgroup(group, consumer, {stream: ">"}, count=10, block=1000)
        for stream_name, events in (messages or []):
            for event_id, event_data in events:
                process_event(event_data)
                r.xack(stream_name, group, event_id)

def process_event(data):
    event_type = data[b"type"].decode()
    payload = json.loads(data[b"data"])
    handlers = {"order.created": send_confirmation_email}
    handlers.get(event_type, lambda p: None)(payload)
```
"""),

    ("WebHooks Implementation", "md", """
# Webhooks Implementation

Webhooks send HTTP POST requests to notify external services of events.

```python
# Sending webhooks
import httpx
import hmac
import hashlib
import json

def send_webhook(url: str, event: dict, secret: str):
    payload = json.dumps(event)
    signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

    httpx.post(url, content=payload, headers={
        "Content-Type": "application/json",
        "X-Signature-SHA256": f"sha256={signature}",
    }, timeout=10)

# Receiving and verifying webhooks
from fastapi import Request, HTTPException

@app.post("/webhooks/github")
async def github_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")

    expected = "sha256=" + hmac.new(
        WEBHOOK_SECRET.encode(), body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event = await request.json()
    process_github_event(event)
    return {"ok": True}
```
"""),

    ("Python OOP Advanced", "md", """
# Python OOP: Abstract Classes and Protocols

```python
from abc import ABC, abstractmethod
from typing import Protocol, runtime_checkable

# Abstract Base Class — enforces interface
class Storage(ABC):
    @abstractmethod
    def save(self, key: str, value: bytes) -> None: ...
    @abstractmethod
    def load(self, key: str) -> bytes: ...
    @abstractmethod
    def delete(self, key: str) -> None: ...

class LocalStorage(Storage):
    def save(self, key, value):
        with open(key, "wb") as f:
            f.write(value)
    def load(self, key):
        with open(key, "rb") as f:
            return f.read()
    def delete(self, key):
        os.remove(key)

# Protocol — structural typing (duck typing)
@runtime_checkable
class Serializable(Protocol):
    def to_dict(self) -> dict: ...
    @classmethod
    def from_dict(cls, data: dict) -> "Serializable": ...

class User:
    def to_dict(self):
        return {"name": self.name}
    @classmethod
    def from_dict(cls, data):
        u = cls(); u.name = data["name"]; return u

isinstance(User(), Serializable)  # True
```
"""),

    ("Async Python with FastAPI Background Tasks", "md", """
# Async Python: Background Tasks and Task Queues

```python
# FastAPI BackgroundTasks (lightweight, same process)
from fastapi import FastAPI, BackgroundTasks

app = FastAPI()

def send_email(to: str, subject: str, body: str):
    # This runs after response is sent
    smtp.send(to=to, subject=subject, body=body)

@app.post("/register")
def register(user: UserCreate, background_tasks: BackgroundTasks):
    db_user = create_user(user)
    background_tasks.add_task(
        send_email,
        to=user.email,
        subject="Welcome!",
        body=f"Hi {user.name}, welcome!"
    )
    return db_user

# Celery (distributed task queue)
from celery import Celery

celery = Celery("tasks", broker="redis://localhost:6379/0")

@celery.task
def process_video(video_id: int):
    video = Video.get(video_id)
    transcode(video)
    notify_user(video.user_id)

# Trigger from FastAPI
@app.post("/videos/{video_id}/process")
def trigger_processing(video_id: int):
    process_video.delay(video_id)
    return {"status": "queued"}
```
"""),

    ("Pydantic Data Validation", "md", """
# Pydantic Data Validation

Pydantic validates data using Python type annotations.

```python
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime

class Address(BaseModel):
    street: str
    city: str
    country: str = "India"

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    age: Optional[int] = Field(None, ge=0, le=150)
    address: Optional[Address] = None
    tags: List[str] = []

    @validator("name")
    def name_must_not_contain_numbers(cls, v):
        if any(c.isdigit() for c in v):
            raise ValueError("Name must not contain numbers")
        return v.title()

# Parsing and validation
user = UserCreate(
    name="alice",
    email="alice@example.com",
    age=30,
)
print(user.name)  # "Alice" (title-cased by validator)
print(user.model_dump())

# FastAPI uses Pydantic automatically
@app.post("/users")
def create_user(user: UserCreate):
    # user is already validated
    return user
```
"""),

    ("Python Logging Best Practices", "md", """
# Python Logging Best Practices

```python
import logging
import sys

# Configure once at startup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("app.log"),
    ]
)

# Use per-module loggers
logger = logging.getLogger(__name__)

def process_order(order_id: int):
    logger.info("Processing order", extra={"order_id": order_id})
    try:
        result = run_payment(order_id)
        logger.info("Order processed", extra={"order_id": order_id, "result": result})
        return result
    except PaymentError as e:
        logger.error("Payment failed", extra={"order_id": order_id, "error": str(e)})
        raise
    except Exception as e:
        logger.exception("Unexpected error processing order %s", order_id)
        raise

# Structured logging with structlog
import structlog
log = structlog.get_logger()
log.info("user.login", user_id=1, ip="1.2.3.4")
```
"""),

    ("GraphQL Basics", "md", """
# GraphQL Basics

GraphQL lets clients request exactly the data they need.

```graphql
# Schema definition
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  body: String!
  author: User!
}

type Query {
  user(id: ID!): User
  users: [User!]!
}

type Mutation {
  createUser(name: String!, email: String!): User!
  deleteUser(id: ID!): Boolean!
}
```

```python
# Strawberry (Python GraphQL)
import strawberry
from typing import List, Optional

@strawberry.type
class User:
    id: int
    name: str
    email: str

@strawberry.type
class Query:
    @strawberry.field
    def user(self, id: int) -> Optional[User]:
        return db.get_user(id)

    @strawberry.field
    def users(self) -> List[User]:
        return db.get_all_users()

schema = strawberry.Schema(query=Query)
```
"""),

    ("MongoDB Aggregation Pipeline", "md", """
# MongoDB Aggregation Pipeline

```javascript
// MongoDB aggregation: complex queries with stages
db.orders.aggregate([
  // Stage 1: filter
  { $match: { status: "completed", createdAt: { $gte: new Date("2024-01-01") } } },

  // Stage 2: join with users collection
  { $lookup: {
    from: "users",
    localField: "userId",
    foreignField: "_id",
    as: "user"
  }},
  { $unwind: "$user" },

  // Stage 3: group and compute
  { $group: {
    _id: "$user._id",
    userName: { $first: "$user.name" },
    totalOrders: { $sum: 1 },
    totalRevenue: { $sum: "$amount" },
    avgOrderValue: { $avg: "$amount" },
  }},

  // Stage 4: filter on computed values
  { $match: { totalRevenue: { $gte: 1000 } } },

  // Stage 5: sort
  { $sort: { totalRevenue: -1 } },

  // Stage 6: limit
  { $limit: 10 },
]);
```
"""),

    ("Kubernetes Basics", "md", """
# Kubernetes Basics

```yaml
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: myregistry/api:v1.2.0
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
# Service
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```
"""),

    ("SQL Window Functions", "md", """
# SQL Window Functions

Window functions compute values across a set of rows related to the current row.

```sql
-- ROW_NUMBER: assign rank within groups
SELECT
  name,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM employees;

-- RANK vs DENSE_RANK
SELECT name, salary,
  RANK() OVER (ORDER BY salary DESC) as rank,        -- gaps after ties
  DENSE_RANK() OVER (ORDER BY salary DESC) as d_rank  -- no gaps
FROM employees;

-- Running total
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date) as running_total
FROM orders;

-- Moving average (last 7 days)
SELECT
  date,
  revenue,
  AVG(revenue) OVER (
    ORDER BY date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as moving_avg_7d
FROM daily_revenue;

-- LAG/LEAD: access previous/next row
SELECT
  date,
  revenue,
  revenue - LAG(revenue) OVER (ORDER BY date) as day_over_day_change
FROM daily_revenue;
```
"""),

    ("Python Pandas for Data Processing", "md", """
# Python Pandas for Data Processing

```python
import pandas as pd

# Load data
df = pd.read_csv("data.csv")
df = pd.read_excel("data.xlsx")

# Inspect
df.head(5)
df.dtypes
df.describe()
df.info()
df.shape  # (rows, cols)

# Filter
df[df["age"] > 25]
df[(df["age"] > 25) & (df["city"] == "Mumbai")]
df.query("age > 25 and city == 'Mumbai'")

# Select columns
df[["name", "email"]]
df.drop(columns=["password", "internal_id"])

# Transform
df["full_name"] = df["first_name"] + " " + df["last_name"]
df["age_group"] = pd.cut(df["age"], bins=[0, 18, 35, 60, 100],
                          labels=["minor", "young", "mid", "senior"])

# Aggregate
df.groupby("department").agg(
    count=("id", "count"),
    avg_salary=("salary", "mean"),
    total_salary=("salary", "sum"),
).reset_index()

# Handle missing values
df.dropna(subset=["email"])
df["phone"].fillna("N/A", inplace=True)
```
"""),

    ("Code Review Best Practices", "md", """
# Code Review Best Practices

**What to look for:**

```
Security:
- SQL injection, XSS, CSRF vulnerabilities
- Secrets/credentials committed
- Authentication/authorization gaps
- Input not validated at system boundaries

Correctness:
- Edge cases not handled (null, empty, negative)
- Off-by-one errors
- Race conditions in concurrent code
- Error paths that swallow exceptions

Performance:
- N+1 queries (loop with DB call inside)
- Missing database indexes on filtered columns
- Large data loaded into memory
- Unbounded queries without pagination

Maintainability:
- Unclear variable/function names
- Function does more than one thing
- Magic numbers without constants
- Duplicated logic that could be extracted
```

**How to give feedback:**

```
Bad:  "This is wrong."
Good: "This query runs inside a loop which causes N+1 DB calls.
       Consider using a JOIN or loading all IDs in one query."

Bad:  "Why did you do it this way?"
Good: "Would it make sense to use X here because Y?"
```

Approve when: logic is correct, no security issues, code is readable.
"""),

    ("Python functools Module", "md", """
# Python functools Module

```python
from functools import lru_cache, partial, reduce, wraps

# lru_cache — memoize function results
@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

fibonacci(50)  # instant — cached

# partial — pre-fill function arguments
from functools import partial

def power(base, exponent):
    return base ** exponent

square = partial(power, exponent=2)
cube = partial(power, exponent=3)

square(5)  # 25
cube(3)    # 27

# reduce — fold a sequence into a value
from functools import reduce

product = reduce(lambda x, y: x * y, [1, 2, 3, 4, 5])  # 120

total = reduce(lambda acc, order: acc + order["amount"], orders, 0)

# wraps — preserve function metadata in decorators
def retry(times=3):
    def decorator(func):
        @wraps(func)  # preserves func.__name__, func.__doc__
        def wrapper(*args, **kwargs):
            for i in range(times):
                try:
                    return func(*args, **kwargs)
                except Exception:
                    if i == times - 1:
                        raise
        return wrapper
    return decorator
```
"""),

    ("Database Migrations with Alembic", "md", """
# Database Migrations with Alembic

Alembic manages SQLAlchemy database schema changes.

```bash
# Setup
pip install alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "add users table"

# Run migrations
alembic upgrade head         # apply all pending
alembic upgrade +1           # apply next one
alembic downgrade -1         # rollback one
alembic downgrade base       # rollback all
alembic current              # show current version
alembic history              # list all migrations
```

Migration file example:

```python
# alembic/versions/abc123_add_users.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

def downgrade():
    op.drop_index("ix_users_email", "users")
    op.drop_table("users")
```
"""),

    ("Python Environment Variables and Config", "md", """
# Python Environment Variables and Config

```python
# pydantic-settings (modern approach)
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Reads from environment variables automatically
    app_name: str = "MyApp"
    debug: bool = False
    database_url: str
    secret_key: str
    redis_url: str = "redis://localhost:6379"
    groq_api_key: Optional[str] = None
    max_workers: int = 4

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Singleton
_settings = None
def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

settings = get_settings()
```

`.env` file:

```env
DATABASE_URL=postgresql://user:pass@localhost/mydb
SECRET_KEY=your-very-secret-key-here
GROQ_API_KEY=gsk_...
DEBUG=true
MAX_WORKERS=8
```

Never commit `.env` to git — add it to `.gitignore`.
"""),

    ("JavaScript Array Methods", "md", """
# JavaScript Array Methods

Essential array methods every developer should know.

```javascript
const users = [
  { id: 1, name: "Alice", age: 30, active: true },
  { id: 2, name: "Bob",   age: 25, active: false },
  { id: 3, name: "Carol", age: 35, active: true },
];

// map — transform each element
const names = users.map(u => u.name);  // ["Alice", "Bob", "Carol"]

// filter — keep matching elements
const active = users.filter(u => u.active);  // Alice, Carol

// reduce — fold into single value
const totalAge = users.reduce((sum, u) => sum + u.age, 0);  // 90

// find / findIndex
const alice = users.find(u => u.name === "Alice");
const idx = users.findIndex(u => u.id === 2);

// some / every
const anyInactive = users.some(u => !u.active);   // true
const allAdults = users.every(u => u.age >= 18);   // true

// flat / flatMap
const nested = [[1,2],[3,4],[5,6]];
nested.flat();  // [1,2,3,4,5,6]

const sentences = ["hello world", "foo bar"];
sentences.flatMap(s => s.split(" "));  // ["hello","world","foo","bar"]

// sort (returns new array in modern usage)
[...users].sort((a, b) => a.age - b.age);
```
"""),

    ("Python Multiprocessing vs Threading", "md", """
# Python Multiprocessing vs Threading

Python's GIL limits true parallelism with threads. Use correctly:

```python
# Threading — good for I/O-bound tasks
import threading
import requests

urls = ["https://api1.com", "https://api2.com", "https://api3.com"]
results = {}

def fetch(url):
    results[url] = requests.get(url).json()

threads = [threading.Thread(target=fetch, args=(url,)) for url in urls]
for t in threads: t.start()
for t in threads: t.join()

# Multiprocessing — good for CPU-bound tasks
from multiprocessing import Pool

def process_image(path):
    img = load_image(path)
    return apply_filter(img)  # CPU intensive

with Pool(processes=4) as pool:
    results = pool.map(process_image, image_paths)

# concurrent.futures — cleaner API
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# I/O bound
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(fetch, url) for url in urls]
    results = [f.result() for f in futures]

# CPU bound
with ProcessPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(process_image, image_paths))
```
"""),

    ("Pagination in APIs", "md", """
# Pagination in APIs

Three common pagination strategies:

**Offset pagination:**
```python
@app.get("/users")
def list_users(page: int = 1, per_page: int = 20, db: Session = Depends(get_db)):
    offset = (page - 1) * per_page
    users = db.query(User).offset(offset).limit(per_page).all()
    total = db.query(User).count()
    return {
        "data": users,
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page,
        }
    }
```

**Cursor pagination (better for large datasets):**
```python
@app.get("/users")
def list_users(cursor: Optional[int] = None, limit: int = 20):
    query = db.query(User).order_by(User.id)
    if cursor:
        query = query.filter(User.id > cursor)
    users = query.limit(limit + 1).all()
    has_more = len(users) > limit
    return {
        "data": users[:limit],
        "next_cursor": users[limit - 1].id if has_more else None,
    }
```
"""),

    ("Security Best Practices", "md", """
# Security Best Practices for Web APIs

```python
# 1. Never store plain-text passwords
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

hashed = pwd_context.hash("user_password")
valid = pwd_context.verify("user_password", hashed)

# 2. Validate and sanitize ALL user input
from pydantic import BaseModel, validator
import re

class UserInput(BaseModel):
    name: str
    email: str

    @validator("name")
    def sanitize_name(cls, v):
        if not re.match(r'^[a-zA-Z\s]+$', v):
            raise ValueError("Name contains invalid characters")
        return v[:100]  # max length

# 3. Use parameterized queries (never f-strings in SQL)
# BAD:  db.execute(f"SELECT * FROM users WHERE email = '{email}'")
# GOOD: db.execute("SELECT * FROM users WHERE email = :email", {"email": email})

# 4. Set security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# 5. Rate limit sensitive endpoints
# 6. Rotate secrets regularly
# 7. Use HTTPS everywhere
# 8. Principle of least privilege for DB users
```
"""),

    ("Python Enum and Constants", "md", """
# Python Enum and Constants

```python
from enum import Enum, IntEnum, auto

class Status(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    DELETED = "deleted"

# Usage
user_status = Status.ACTIVE
print(user_status.value)  # "active"
print(user_status == "active")  # True (str Enum)

# In SQLAlchemy
from sqlalchemy import Enum as SAEnum

class User(Base):
    status = mapped_column(SAEnum(Status), default=Status.PENDING)

# In Pydantic
class UserResponse(BaseModel):
    status: Status

# IntEnum for ordered statuses
class Priority(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

Priority.HIGH > Priority.LOW  # True

# auto() — auto-assign values
class Color(Enum):
    RED = auto()    # 1
    GREEN = auto()  # 2
    BLUE = auto()   # 3
```
"""),

    ("Dependency Injection Pattern", "md", """
# Dependency Injection Pattern

Dependency injection decouples classes from their dependencies.

```python
# FastAPI DI
from fastapi import Depends
from sqlalchemy.orm import Session
from src.core.database import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Header(...),
    db: Session = Depends(get_db)
) -> User:
    payload = verify_jwt(token)
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(401)
    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403)
    return user

@app.get("/admin/users")
def admin_list_users(
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    return db.query(User).all()

# Testable — inject mock DB in tests
def test_admin_route():
    app.dependency_overrides[get_db] = lambda: mock_db
    response = client.get("/admin/users", headers={"token": admin_token})
    assert response.status_code == 200
```
"""),

    ("Python String Manipulation", "md", """
# Python String Manipulation

```python
# Formatting
name = "Alice"
age = 30
f"Hello {name}, you are {age} years old"  # f-string (preferred)
"Hello {}, you are {}".format(name, age)
f"{3.14159:.2f}"   # "3.14"
f"{1000000:,}"     # "1,000,000"

# Common methods
s = "  Hello, World!  "
s.strip()           # "Hello, World!"
s.lower()           # "  hello, world!  "
s.upper()           # "  HELLO, WORLD!  "
s.replace(",", "")  # "  Hello World!  "
s.split(", ")       # ["  Hello", "World!  "]
", ".join(["a", "b", "c"])  # "a, b, c"
s.startswith("  H") # True
s.endswith("!  ")   # True
"world" in s        # True

# Regular expressions
import re
emails = re.findall(r'[\w.+-]+@[\w-]+\.[a-z]{2,}', text)
clean = re.sub(r'<[^>]+>', '', html)  # strip HTML tags
parts = re.split(r'\s+', "hello   world")  # split on whitespace

# Multi-line strings
query = (
    "SELECT *\n"
    "FROM users\n"
    "WHERE active = true"
)
```
"""),

    ("API Versioning Strategies", "md", """
# API Versioning Strategies

**URL versioning (most common):**
```python
# FastAPI routers
from fastapi import FastAPI, APIRouter

app = FastAPI()

v1 = APIRouter(prefix="/api/v1")
v2 = APIRouter(prefix="/api/v2")

@v1.get("/users")
def list_users_v1():
    return [{"id": 1, "name": "Alice"}]

@v2.get("/users")
def list_users_v2():
    return {"data": [{"id": 1, "name": "Alice"}], "meta": {"total": 1}}

app.include_router(v1)
app.include_router(v2)
```

**Header versioning:**
```python
@app.get("/users")
def list_users(request: Request):
    version = request.headers.get("API-Version", "1")
    if version == "2":
        return v2_response()
    return v1_response()
```

**Deprecation strategy:**
- Keep old version for at least 6 months after new version
- Add `Deprecation: true` header on old version responses
- Send email notice to API users
- Log usage of deprecated endpoints to know when it's safe to remove
"""),

    ("Caching Strategies", "md", """
# Caching Strategies

**Cache-aside (lazy loading):**
```python
def get_product(product_id: int):
    cached = cache.get(f"product:{product_id}")
    if cached:
        return cached
    product = db.get(Product, product_id)
    cache.setex(f"product:{product_id}", 3600, serialize(product))
    return product
```

**Write-through (update cache on write):**
```python
def update_product(product_id: int, data: dict):
    product = db.get(Product, product_id)
    for k, v in data.items():
        setattr(product, k, v)
    db.commit()
    cache.setex(f"product:{product_id}", 3600, serialize(product))
    return product
```

**Cache invalidation:**
```python
def delete_product(product_id: int):
    db.delete(db.get(Product, product_id))
    db.commit()
    cache.delete(f"product:{product_id}")
    cache.delete("products:list")  # invalidate list cache too
```

Cache TTL guidelines:
- User sessions: 30 min - 24 hours
- Product listings: 5-15 min
- Static config: 1 hour - 24 hours
- User profile: 5-30 min
"""),
]


# ── Helper ───────────────────────────────────────────────────────────────────

def chunk_text(text: str, size: int = 500, overlap: int = 50):
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += size - overlap
    return chunks


def stable_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:64]


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    db = SessionLocal()
    vs = VectorStoreService()

    # Use a fixed "system" user id — pick id=1 (first user in DB)
    system_user_id = db.execute(
        __import__("sqlalchemy").text("SELECT id FROM users ORDER BY id LIMIT 1")
    ).scalar()

    if not system_user_id:
        print("ERROR: No users found in DB. Create at least one user first.")
        sys.exit(1)

    print(f"Seeding 50 docs as user_id={system_user_id}")

    inserted = 0
    for title, ext, content in DOCS:
        file_name = title.lower().replace(" ", "_") + "." + ext
        content_hash = stable_hash(content)

        # Skip if already exists
        existing = db.execute(
            __import__("sqlalchemy").text(
                "SELECT id FROM documents WHERE file_hash = :h"
            ),
            {"h": content_hash}
        ).scalar()
        if existing:
            print(f"  SKIP (exists): {title}")
            continue

        # 1. Create document record
        doc = Document(
            title=title,
            file_name=file_name,
            file_path=f"seed/{file_name}",
            file_type=ext,
            file_hash=content_hash,
            uploaded_by=system_user_id,
        )
        db.add(doc)
        db.flush()  # get doc.id without committing

        # 2. Chunk, embed, store in Qdrant
        chunks = chunk_text(content)
        for chunk in chunks:
            embedding = EmbeddingsService.generate(chunk)
            vs.insert_chunk(
                chunk_id=str(uuid.uuid4()),
                document_id=doc.id,
                filename=title,
                uploaded_by=system_user_id,
                uploaded_by_name="System",
                text=chunk,
                embedding=embedding,
            )

        db.commit()
        inserted += 1
        print(f"  OK ({len(chunks)} chunks): {title}")

    print(f"\nDone. Inserted {inserted} new documents.")
    db.close()


if __name__ == "__main__":
    main()
