FROM python:3.12-slim
WORKDIR /app
COPY mcp-bridge/ ./mcp-bridge/
CMD ["python", "mcp-bridge/server.py"]
