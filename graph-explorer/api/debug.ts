import { resolve, join } from 'path';
import { existsSync, readdirSync } from 'fs';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const debugInfo = {
        cwd: process.cwd(),
        dirname: __dirname,
        corpusCwd: resolve(process.cwd(), 'corpus'),
        corpusDirname: resolve(__dirname, '..', 'corpus'),
        cwdExists: existsSync(resolve(process.cwd(), 'corpus')),
        dirnameExists: existsSync(resolve(__dirname, '..', 'corpus')),
        cwdContents: [] as string[],
        dirnameContents: [] as string[]
    };

    try { debugInfo.cwdContents = readdirSync(process.cwd()); } catch (e) {}
    try { debugInfo.dirnameContents = readdirSync(__dirname); } catch (e) {}

    res.status(200).json(debugInfo);
}
