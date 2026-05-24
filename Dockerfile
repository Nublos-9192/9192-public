FROM python:3.12-slim
LABEL org.opencontainers.image.title="9192 Public MCP Bridge"
LABEL org.opencontainers.image.description="Remote MCP bridge for the public 9192 machine-to-machine service."
LABEL org.opencontainers.image.url="https://nineoneninetwo.com.br/"
LABEL org.opencontainers.image.source="https://github.com/Nublos-9192/9192-public"
LABEL org.opencontainers.image.documentation="https://nineoneninetwo.com.br/docs"
ENV PYTHONUNBUFFERED=1
ENV NINEONENINETWO_BASE_URL="https://nineoneninetwo.com.br"
WORKDIR /app
COPY mcp-bridge/ ./mcp-bridge/
COPY discovery/ ./discovery/
COPY README.md QUICKSTART.md TRUST.md ./
CMD ["python", "mcp-bridge/server.py"]
