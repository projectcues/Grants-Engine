import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const filePath = searchParams.get('path');

  try {
    if (action === 'list') {
      const dirsToTry = [
        '/home/u198287421',
        '/home/u198287421/.pm2/logs',
        '/home/u198287421/.pm2',
        path.join(process.cwd(), '.next'),
        process.cwd()
      ];
      
      const results: any = {};
      for (const d of dirsToTry) {
        if (fs.existsSync(d)) {
          try {
            results[d] = fs.readdirSync(d).map(file => {
              const stat = fs.statSync(path.join(d, file));
              return {
                name: file,
                isDir: stat.isDirectory(),
                size: stat.size,
                mtime: stat.mtime
              };
            });
          } catch (e: any) {
            results[d] = { error: e.message };
          }
        } else {
          results[d] = 'not_exists';
        }
      }
      return NextResponse.json(results);
    }
    
    if (action === 'read' && filePath) {
      if (fs.existsSync(filePath)) {
        // Read last 100KB to prevent memory issues
        const stat = fs.statSync(filePath);
        const start = Math.max(0, stat.size - 100 * 1024);
        const buffer = Buffer.alloc(stat.size - start);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, buffer.length, start);
        fs.closeSync(fd);
        return new NextResponse(buffer.toString('utf8'), {
          headers: { 'Content-Type': 'text/plain' }
        });
      } else {
        return NextResponse.json({ error: 'File does not exist' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
