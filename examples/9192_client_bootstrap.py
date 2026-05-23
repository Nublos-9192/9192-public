#!/usr/bin/env python3
import socket, ssl, struct, sys

HOST = sys.argv[1] if len(sys.argv) > 1 else 'edge.nineoneninetwo.com.br'
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 9443

MAGIC = 0x32393139
HEADER = 36
CMDS = {'HELLO': 1, 'CAPS': 2}

def checksum32(data):
    a, b = 1, 0
    for x in data:
        a = (a + x) % 65521
        b = (b + a) % 65521
    return (b << 16) | a

def frame(cmd, seq):
    base = struct.pack('<IHHIIQQ', MAGIC, 1, HEADER, CMDS[cmd], 0, seq, 0)
    return base + struct.pack('<I', checksum32(base))

def recvn(s, n):
    out = b''
    while len(out) < n:
        chunk = s.recv(n - len(out))
        if not chunk:
            raise RuntimeError('connection closed')
        out += chunk
    return out

def varint(buf, off):
    value = 0
    shift = 0
    for _ in range(10):
        b = buf[off]
        off += 1
        value |= (b & 0x7f) << shift
        if not (b & 0x80):
            return value, off
        shift += 7
    raise RuntimeError('invalid varint')

def parse_response(s):
    h = recvn(s, HEADER)
    magic, version, header, cmd, flags, seq, n, checksum = struct.unpack('<IHHIIQQI', h)
    if magic != MAGIC or version != 1 or header != HEADER:
        raise RuntimeError('bad frame header')
    body = recvn(s, n)
    status = struct.unpack_from('<H', body, 0)[0]
    off = 2
    msg_len, off = varint(body, off)
    msg = body[off:off + msg_len].decode('utf-8', 'replace')
    off += msg_len
    payload_len, off = varint(body, off)
    payload = body[off:off + payload_len].decode('utf-8', 'replace')
    return status, msg, payload

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT), timeout=5) as raw:
    with ctx.wrap_socket(raw, server_hostname=HOST) as s:
        for seq, cmd in enumerate(['HELLO', 'CAPS'], 1):
            s.sendall(frame(cmd, seq))
            status, msg, payload = parse_response(s)
            print(f'{cmd} status={status} message={msg}')
            print(payload.strip())
