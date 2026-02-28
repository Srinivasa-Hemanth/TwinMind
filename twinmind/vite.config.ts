import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import officeParser from 'officeparser';
import * as pdfParseAny from 'pdf-parse';
const pdfParse = (pdfParseAny as any).default || pdfParseAny;

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        plugin(),
        {
            name: 'local-file-saver',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.method === 'POST' && req.url === '/api/save-file') {
                        let body: Buffer[] = [];
                        req.on('data', chunk => {
                            body.push(chunk);
                        });
                        req.on('end', () => {
                            const fileName = req.headers['x-file-name'] as string;
                            const folderName = (req.headers['x-folder-name'] as string) || 'Calls Transcript';

                            if (!fileName) {
                                res.statusCode = 400;
                                return res.end('Missing file name');
                            }
                            // Save to specific folder inside Projects
                            const targetDir = path.join(process.cwd(), 'Projects', folderName);
                            if (!fs.existsSync(targetDir)) {
                                fs.mkdirSync(targetDir, { recursive: true });
                            }
                            const filePath = path.join(targetDir, fileName);
                            const buffer = Buffer.concat(body);
                            fs.writeFileSync(filePath, buffer);
                            res.statusCode = 200;
                            res.end(JSON.stringify({ success: true, path: filePath }));
                        });
                    } else if (req.method === 'POST' && req.url === '/api/chat') {
                        let body = '';
                        req.on('data', chunk => {
                            body += chunk.toString();
                        });
                        req.on('end', async () => {
                            try {
                                const { url, headers, payload } = JSON.parse(body);
                                const response = await fetch(url, {
                                    method: 'POST',
                                    headers: headers,
                                    body: JSON.stringify(payload)
                                });

                                const data = await response.text();
                                res.statusCode = response.status;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(data);
                            } catch (e: any) {
                                console.error('Proxy Fetch Error:', e, e.cause);
                                res.statusCode = 500;
                                res.end(JSON.stringify({ error: String(e), cause: e.cause ? String(e.cause) : null }));
                            }
                        });
                    } else if (req.method === 'GET' && req.url === '/api/get-chat-history') {
                        const historyPath = path.join(process.cwd(), 'Projects', 'Chat History', 'twinmind_chat_history.json');
                        res.setHeader('Content-Type', 'application/json');
                        if (fs.existsSync(historyPath)) {
                            const data = fs.readFileSync(historyPath, 'utf8');
                            res.statusCode = 200;
                            res.end(data);
                        } else {
                            res.statusCode = 200;
                            res.end(JSON.stringify([]));
                        }
                    } else if (req.method === 'GET' && req.url === '/api/get-project-docs') {
                        const targetDir = path.join(process.cwd(), 'Projects');
                        let docs: { filename: string, content: string }[] = [];

                        const readDocs = async (dir: string) => {
                            if (!fs.existsSync(dir)) return;
                            const files = fs.readdirSync(dir);
                            for (const file of files) {
                                const fullPath = path.join(dir, file);
                                const stat = fs.statSync(fullPath);
                                if (stat.isDirectory()) {
                                    await readDocs(fullPath);
                                } else {
                                    const ext = path.extname(file).toLowerCase();
                                    const relativePath = path.relative(targetDir, fullPath);

                                    try {
                                        if (['.txt', '.md', '.json', '.csv'].includes(ext)) {
                                            const content = fs.readFileSync(fullPath, 'utf-8');
                                            docs.push({ filename: relativePath, content });
                                        } else if (['.pptx', '.docx', '.xlsx', '.odt', '.odp', '.ods'].includes(ext)) {
                                            const contentAST = await officeParser.parseOffice(fullPath);
                                            docs.push({ filename: relativePath, content: typeof contentAST === 'string' ? contentAST : JSON.stringify(contentAST) });
                                        } else if (ext === '.pdf') {
                                            const dataBuffer = fs.readFileSync(fullPath);
                                            const data = await pdfParse(dataBuffer);
                                            docs.push({ filename: relativePath, content: data.text });
                                        }
                                    } catch (e) {
                                        console.warn(`Could not read ${fullPath}`, e);
                                    }
                                }
                            }
                        };

                        if (!fs.existsSync(targetDir)) {
                            fs.mkdirSync(targetDir, { recursive: true });
                        }

                        readDocs(targetDir).then(() => {
                            res.setHeader('Content-Type', 'application/json');
                            res.statusCode = 200;
                            res.end(JSON.stringify(docs));
                        }).catch(err => {
                            console.error('API Error:', err);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: String(err) }));
                        });
                        return;
                    } else {
                        next();
                    }
                });
            }
        }
    ],
    server: {
        port: 54245,
    }
})
