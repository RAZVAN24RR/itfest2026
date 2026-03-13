FROM python:3.12-slim

WORKDIR /app

# Instalăm Poetry
RUN pip install --no-cache-dir poetry

# Copiem pyproject și lock
COPY pyproject.toml poetry.lock ./

# Instalăm doar dependențele de producție
RUN poetry install --no-root --without dev

# Copiem restul codului
COPY . .

EXPOSE 8000

# Comanda FastAPI
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
