#!/usr/bin/env python3
"""Structural validation of backend/openapi.yaml against a subset of the
enterprise OpenAPI rules (servers, protected-op responses, rate-limit/idempotency/
conditional headers, schema constraints, custom extensions). Exits non-zero on any
Critical or High finding so CI can gate on it.

NOTE: this is a self-contained subset check, NOT the official 55-rule validator.
Run the enterprise tool (Spectral/Coderz ruleset) for the authoritative result.
"""
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPEC = os.path.join(ROOT, "backend", "openapi.yaml")
doc = yaml.safe_load(open(SPEC, encoding="utf-8"))
crit, high, warn = [], [], []


def resolve(node):
    if isinstance(node, dict) and "$ref" in node:
        t = doc
        for p in node["$ref"].lstrip("#/").split("/"):
            t = t[p]
        return resolve(t)
    return node


servers = doc.get("servers", [])
if not servers:
    crit.append("servers array is empty")
envs = set()
for s in servers:
    u = s.get("url", "")
    if re.search(r"example\.com|localhost|127\.0\.0\.1", u):
        crit.append(f"server has placeholder/localhost url: {u}")
    if u.endswith("/"):
        high.append(f"server url has trailing slash: {u}")
    if "x-environment" not in s:
        high.append(f"server missing x-environment: {u}")
    else:
        envs.add(s["x-environment"])
for need in ["development", "testing", "staging", "production"]:
    if need not in envs:
        high.append(f"missing server environment: {need}")

STATE_CHANGING = {
    ("/api/reports", "post"),
    ("/api/reports/{id}", "put"),
    ("/api/reports/{id}/submit", "post"),
    ("/api/reports/{id}/audit", "post"),
}
op_ids = []
for path, item in doc["paths"].items():
    for method, op in item.items():
        if method not in ("get", "post", "put", "patch", "delete"):
            continue
        loc = f"{method.upper()} {path}"
        oid = op.get("operationId")
        if not oid:
            crit.append(f"{loc}: missing operationId")
        else:
            op_ids.append(oid)
            if not re.match(r"^[A-Za-z0-9_-]+$", oid):
                high.append(f"{loc}: operationId not URL-safe: {oid}")
        if not op.get("summary"):
            high.append(f"{loc}: missing summary")
        if not op.get("description"):
            high.append(f"{loc}: missing description")
        if "x-timeout" not in op:
            high.append(f"{loc}: missing x-timeout")
        for p in op.get("parameters", []):
            rp = resolve(p)
            if not rp.get("description"):
                high.append(f"{loc}: parameter {rp.get('name')} missing description")
        responses = op.get("responses", {})
        secured = op.get("security", doc.get("security")) != []
        if secured:
            for code in ("401", "403", "429"):
                if code not in responses:
                    crit.append(f"{loc}: protected op missing {code}")
        d = resolve(responses.get("default", {}))
        if not d:
            high.append(f"{loc}: missing default response")
        elif "application/problem+json" not in (d.get("content") or {}):
            high.append(f"{loc}: default response not problem+json")
        for code, r in responses.items():
            if code.startswith("2"):
                hdrs = resolve(r).get("headers", {})
                for h in ("RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"):
                    if h not in hdrs:
                        high.append(f"{loc} {code}: missing {h} header")
                if code == "201" and "Location" not in hdrs:
                    crit.append(f"{loc} {code}: missing Location header")
                if method == "get" and "ETag" not in hdrs:
                    high.append(f"{loc} {code}: GET missing ETag header")
        r429 = resolve(responses.get("429", {}))
        if secured and "Retry-After" not in (r429.get("headers") or {}):
            high.append(f"{loc}: 429 missing Retry-After")
        if method in ("post", "put", "patch") and "422" not in responses:
            high.append(f"{loc}: missing 422")
        if (path, method) in STATE_CHANGING:
            names = [resolve(p).get("name") for p in op.get("parameters", [])]
            if "Idempotency-Key" not in names:
                high.append(f"{loc}: state-changing op missing Idempotency-Key")
            if "409" not in responses:
                high.append(f"{loc}: state-changing op missing 409")
        if path == "/api/reports" and method == "get":
            hdrs = resolve(responses["200"]).get("headers", {})
            for h in ("X-Total-Count", "X-Page", "X-Page-Size", "Link"):
                if h not in hdrs:
                    high.append(f"{loc}: list missing pagination header {h}")

if len(op_ids) != len(set(op_ids)):
    crit.append("duplicate operationId values")


def walk(node, where):
    if isinstance(node, dict):
        t = node.get("type")
        types = t if isinstance(t, list) else [t]
        if "array" in types:
            for k in ("minItems", "maxItems"):
                if k not in node:
                    high.append(f"{where}: array missing {k}")
        if "string" in types and "enum" not in node:
            for k in ("minLength", "maxLength"):
                if k not in node:
                    high.append(f"{where}: string missing {k}")
        if "integer" in types or "number" in types:
            for k in ("minimum", "maximum"):
                if k not in node:
                    high.append(f"{where}: number missing {k}")
        if "items" in node:
            walk(node["items"], f"{where}.items")
        if isinstance(node.get("additionalProperties"), dict):
            walk(node["additionalProperties"], f"{where}.additionalProperties")
        for pk, pv in (node.get("properties") or {}).items():
            walk(pv, f"{where}.{pk}")


for name, sch in doc["components"]["schemas"].items():
    walk(sch, f"schema:{name}")

print("=== OpenAPI structural validation (subset of enterprise rules) ===")
print(f"CRITICAL: {len(crit)}")
for x in crit:
    print("  [CRIT]", x)
print(f"HIGH: {len(high)}")
for x in sorted(set(high)):
    print("  [HIGH]", x)
print(f"WARN: {len(warn)}  (informational)")
ok = not crit and not high
print("\nRESULT:", "PASS (no Critical/High)" if ok else "FAIL")
sys.exit(0 if ok else 1)
