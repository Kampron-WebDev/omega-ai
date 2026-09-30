# 46 — MCP Server

**Phase:** 7 · Platform · **Depends on:** 36, 39, 40, 45 · **Unlocks:** coding agents that read Omega directly

## Goal

Close the loop with coding agents. Omega exposes a Model Context Protocol server, so Claude Code, Cursor, and other MCP clients can list a developer's projects and read the brief, the architecture, specs, build plans, and individual build units directly, with no zip download needed. A developer adds the server once with a personal access token, and their agent can ask "What's unit 7 of the payments project?"

## Read first

- The MCP TypeScript SDK docs and the streamable HTTP transport, for the current `@modelcontextprotocol/sdk` version. Check whether a maintained Next.js adapter (for example `mcp-handler`) fits this Next.js version, and prefer it over hand-rolled transport code if so.
- `lib/api-tokens.ts` and `getRequestIdentity` (spec 45), `lib/project-specs.ts`, `types/build-plan.ts`, `lib/agent-pack/build-pack.ts`, `lib/canvas-mermaid.ts`, `lib/project-brief.ts`

## Install

- `@modelcontextprotocol/sdk`, plus the adapter if chosen. Verify the package names and versions at implementation time.

## Implementation

1. **Endpoint: `app/api/mcp/route.ts`**, streamable HTTP, stateless.
   - Every request is authenticated with a Bearer personal access token through `getRequestIdentity`. There is no cookie auth on this endpoint.
   - A missing or invalid token → `401` with a `WWW-Authenticate: Bearer` header.

2. **Tools** (all read-only; each one resolves access through the same helpers as the web routes):

   | Tool | Input | Returns |
   | --- | --- | --- |
   | `list_projects` | — | id, name, role, updatedAt |
   | `get_project_brief` | projectId | brief Markdown |
   | `get_architecture` | projectId, format: `mermaid` \| `json` \| `summary` | the diagram, the graph, or a component list with kinds, technologies, and connections |
   | `list_specs` | projectId | summaries |
   | `get_spec` | projectId, specId? (default: latest) | Markdown |
   | `list_build_plans` | projectId | summaries |
   | `get_build_plan` | projectId, planId? (default: latest) | phases plus a unit index |
   | `get_build_unit` | projectId, unitNumber, planId? | the unit's Markdown |
   | `get_context_pack_file` | projectId, path, planId? | one file from the agent pack (same builder as spec 40) |

   - Tool descriptions are written for agents: when to call each tool and what it returns.
   - Resolve a plan revision once and return its ID on every response; subsequent unit/file reads pin that revision. Return structured pagination or bounded sections plus continuation cursors when content exceeds 100 KB. Never silently truncate executable requirements or return broken partial JSON as a complete artifact.
   - Inputs are validated with zod. An unknown or inaccessible project gives the same "not found" error either way.

3. **Resources and prompts.** Optional and out of scope, unless the SDK makes a resource for `omega://projects/{id}/spec` trivial. If added, it mirrors `get_spec`.

4. **Rate limiting.** Enforce 120 calls/token/minute across instances using a shared database-backed bucket (or a measured shared limiter); instance-local counters are insufficient. Validate transport Origin, request size and protocol versions using the selected SDK.

5. **Setup page.**
   - `/settings/mcp`, linked from the tokens page.
   - The endpoint URL.
   - A copyable Claude Code command (`claude mcp add --transport http omega {url}/api/mcp --header "Authorization: Bearer <token>"`) and the JSON config for other clients.
   - A "Test connection" button that calls `list_projects` with a token pasted by the user (the token is not stored).

6. **Logging.** Every tool call logs the tool name, `userId`, `projectId`, duration, and result size. Never log output content.

## Scope limits

- No write tools in this unit. Spec 58 introduces narrowly scoped execution reporting with a separate credential type.
- PAT-based clients only in this release. Document tested clients and authentication compatibility; do not claim universal remote MCP compatibility. Clients requiring standard OAuth discovery need a separately implemented protocol/auth slice before support is advertised. Check current MCP authorization and security requirements at implementation.

## Edge cases

- A project deleted between `list_projects` and `get_spec`: not found.
- A plan without the requested unit number: a clear error listing the valid range.
- Very large graphs: paginate valid structured data or direct the caller to the pinned authorized download; never cut a JSON document mid-value.

## Tests

- Each tool with the data layer mocked: happy path, not a member, missing entity.
- 401 without a token; a revoked token is rejected.
- Output pagination, exact revision continuity and valid reassembly of structured content above the response cap.

## Check when done

- [ ] Claude Code connects with the documented command and can call every tool against a real project. Verify this by hand and record it.
- [ ] Access rules match the web app exactly.
- [ ] The setup page produces a working configuration.
- [ ] Definition of done in `context/feature-specs/README.md`.
