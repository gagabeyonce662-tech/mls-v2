import { readFileSync, existsSync } from 'fs';
import { join, resolve, normalize, extname } from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_EXTENSIONS = new Set(['.py', '.ts', '.tsx', '.css', '.json', '.js', '.md', '.txt', '.html']);
const BLACKLISTED_FILES = new Set(['.env', 'package-lock.json', 'yarn.lock', 'vercel.json']);
const BLACKLISTED_DIRS = ['.git', 'node_modules', '.vercel', '.gemini'];

export default function handler(req: VercelRequest, res: VercelResponse) {
    const { file, line } = req.query;

    if (!file || typeof file !== 'string') {
        return res.status(400).json({ error: 'Missing file parameter' });
    }

    try {
        // Resolve project root. Note: On Vercel, process.cwd() is the deployment root.
        const projectRoot = resolve(process.cwd());
        const fullPath = normalize(join(projectRoot, file));

        // SECURITY 1: Prevent Directory Traversal
        if (!fullPath.startsWith(projectRoot)) {
            return res.status(403).json({ error: 'Access denied: Directory traversal blocked' });
        }

        // SECURITY 2: Check Extension Whitelist
        if (!ALLOWED_EXTENSIONS.has(extname(fullPath).toLowerCase())) {
            return res.status(403).json({ error: 'Access denied: File type not allowed' });
        }

        // SECURITY 3: Blacklisted Files/Dirs
        const pathParts = fullPath.split(/[\\/]/);
        if (pathParts.some(part => BLACKLISTED_DIRS.includes(part) || BLACKLISTED_FILES.has(part))) {
            return res.status(403).json({ error: 'Access denied: Sensitive file or directory' });
        }

        if (!existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        const targetLine = line ? parseInt((line as string).replace('L', '')) : 1;
        const start = Math.max(0, targetLine - 10);
        const end = Math.min(lines.length, targetLine + 50);
        
        const snippet = lines.slice(start, end).join('\n');

        res.status(200).json({
            snippet,
            startLine: start + 1,
            targetLine
        });
    } catch (err) {
        res.status(500).json({ error: `Internal Server Error: ${err}` });
    }
}
