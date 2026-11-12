import {getAllSkills, getSkill, resolveSkillFile, toSummary} from '@/lib/skills';
import {INSTALL_TARGETS, DEFAULT_TARGET_ID, installCommand, mentionFor} from '@/lib/targets';
import {SITE_NAME, siteOrigin} from '@/lib/site';
import fs from 'node:fs';

/**
 * Minimal stateless MCP server (Streamable HTTP transport, JSON responses only).
 * Add to a client with the URL <origin>/mcp. No sessions, no SSE, no auth: the catalog is public.
 */

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

type JsonRpcId = string | number | null;
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

const TOOLS = [
  {
    name: 'list_skills',
    description: 'List the skills in the registry, optionally filtered by a search query or collection.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {type: 'string', description: 'Case-insensitive match against name, description and tags.'},
        collection: {type: 'string', description: 'Only return skills in this collection.'},
      },
    },
  },
  {
    name: 'get_skill',
    description: 'Return the full text of a skill. Defaults to SKILL.md; pass `file` for a supporting file such as references/coverage.md.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {type: 'string', description: 'Skill name, for example "git-commit-message".'},
        file: {type: 'string', description: 'Relative path inside the skill folder. Defaults to SKILL.md.'},
      },
      required: ['name'],
    },
  },
  {
    name: 'install_skill',
    description: 'Return the shell command that installs a skill for a given agent. Does not run anything.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {type: 'string'},
        target: {type: 'string', enum: INSTALL_TARGETS.map(t => t.id), description: `Defaults to ${DEFAULT_TARGET_ID}.`},
        project: {type: 'boolean', description: 'Install into the current project instead of the home directory.'},
      },
      required: ['name'],
    },
  },
] as const;

interface ToolResult {
  content: Array<{type: 'text'; text: string}>;
  isError?: boolean;
}

const text = (t: string): ToolResult => ({content: [{type: 'text', text: t}]});
const fail = (t: string): ToolResult => ({content: [{type: 'text', text: t}], isError: true});
const json = (v: unknown): ToolResult => text(JSON.stringify(v, null, 2));

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function callTool(name: string, args: Record<string, unknown>, origin: string): ToolResult {
  switch (name) {
    case 'list_skills': {
      const q = str(args.query)?.toLowerCase();
      const collection = str(args.collection);
      const skills = getAllSkills()
        .filter(s => !collection || s.collection === collection)
        .filter(
          s =>
            !q ||
            s.slug.includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.tags.some(t => t.toLowerCase().includes(q)),
        )
        .map(s => {
          const {slug, description, collection: c, capabilities} = toSummary(s);
          return {name: slug, description, collection: c, capabilities, url: `${origin}/skills/${slug}`};
        });
      return json({count: skills.length, skills});
    }
    case 'get_skill': {
      const skillName = str(args.name);
      if (!skillName) return fail('`name` is required.');
      const skill = getSkill(skillName);
      if (!skill) return fail(`No skill named "${skillName}". Use list_skills to see what exists.`);
      const file = str(args.file) ?? 'SKILL.md';
      const abs = resolveSkillFile(skill.slug, file);
      if (!abs) {
        return fail(`No file "${file}" in ${skill.slug}. Files: ${skill.files.map(f => f.path).join(', ')}`);
      }
      return text(fs.readFileSync(abs, 'utf8'));
    }
    case 'install_skill': {
      const skillName = str(args.name);
      if (!skillName) return fail('`name` is required.');
      if (!getSkill(skillName)) return fail(`No skill named "${skillName}".`);
      const target = str(args.target) ?? DEFAULT_TARGET_ID;
      if (!INSTALL_TARGETS.some(t => t.id === target)) {
        return fail(`Unknown target "${target}". Use one of: ${INSTALL_TARGETS.map(t => t.id).join(', ')}.`);
      }
      const isProject = args.project === true;
      return json({
        command: installCommand(origin, skillName, target, isProject),
        mention: mentionFor(skillName, target),
        note: 'Run the command in a terminal. Restart the agent session afterwards if it caches the skill list.',
      });
    }
    default:
      return fail(`Unknown tool "${name}".`);
  }
}

function rpcResult(id: JsonRpcId, result: unknown) {
  return {jsonrpc: '2.0' as const, id, result};
}
function rpcError(id: JsonRpcId, code: number, message: string) {
  return {jsonrpc: '2.0' as const, id, error: {code, message}};
}

function handle(msg: JsonRpcRequest, origin: string) {
  const id = msg.id ?? null;
  // Notifications have no id and get no response.
  if (msg.id === undefined) return null;

  switch (msg.method) {
    case 'initialize': {
      const requested = str(msg.params?.protocolVersion);
      const protocolVersion =
        requested && PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0];
      return rpcResult(id, {
        protocolVersion,
        capabilities: {tools: {listChanged: false}},
        serverInfo: {name: SITE_NAME, version: '0.1.0'},
        instructions: 'Search, read and install agent skills. Start with list_skills.',
      });
    }
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return rpcResult(id, {tools: TOOLS});
    case 'tools/call': {
      const toolName = str(msg.params?.name);
      if (!toolName) return rpcError(id, -32602, 'Missing tool name.');
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
      try {
        return rpcResult(id, callTool(toolName, args, origin));
      } catch (error) {
        console.error('[mcp] tool failed', toolName, error);
        return rpcResult(id, fail('The tool failed unexpectedly.'));
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${msg.method}`);
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id',
};

export async function POST(request: Request) {
  const origin = siteOrigin(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(rpcError(null, -32700, 'Parse error'), {status: 400, headers: CORS});
  }

  const isBatch = Array.isArray(body);
  const messages = (isBatch ? body : [body]) as JsonRpcRequest[];
  if (messages.length === 0 || messages.length > 50) {
    return Response.json(rpcError(null, -32600, 'Invalid request'), {status: 400, headers: CORS});
  }
  if (messages.some(m => !m || m.jsonrpc !== '2.0' || typeof m.method !== 'string')) {
    return Response.json(rpcError(null, -32600, 'Invalid request'), {status: 400, headers: CORS});
  }

  const responses = messages.map(m => handle(m, origin)).filter(r => r !== null);
  if (responses.length === 0) return new Response(null, {status: 202, headers: CORS});
  return Response.json(isBatch ? responses : responses[0], {headers: CORS});
}

export async function GET() {
  // Stateless server: no server-initiated SSE stream.
  return new Response('This MCP server accepts POST only.', {status: 405, headers: {...CORS, Allow: 'POST, OPTIONS'}});
}

export async function OPTIONS() {
  return new Response(null, {status: 204, headers: CORS});
}
