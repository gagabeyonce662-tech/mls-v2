import { resolve, join } from 'path';
import { existsSync, readdirSync } from 'fs';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const debugInfo = {
        cwd: process.cwd(),
        corpusCwd: resolve(process.cwd(), 'corpus'),
        cwdExists: existsSync(resolve(process.cwd(), 'corpus')),
        cwdContents: [] as string[]
    };

    try { debugInfo.cwdContents = readdirSync(process.cwd()); } catch (e) {}

    res.status(200).json(debugInfo);
}
