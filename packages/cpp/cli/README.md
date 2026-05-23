# 9192 C++ CLI Package

This package wraps the existing native C++ reference client:

```text
C:\9192_system\client\9192_public_client_cli.cpp
```

Build from the repository root:

```powershell
C:\9192_system\build_9192_public_client_cli_windows.bat
```

Run against the public edge:

```powershell
C:\9192_system\build\client\9192_public_client_cli.exe hello --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
C:\9192_system\build\client\9192_public_client_cli.exe quote-get-pulse --machine cpp_demo --bits 65536 --max-output 8192 --host edge.nineoneninetwo.com.br --port 9443 --sni edge.nineoneninetwo.com.br
```

The C++ CLI is the canonical native protocol reference. The JS packages are
integration adapters for adoption, demos, and agent tooling.

