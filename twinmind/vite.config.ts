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
                            if (!fileName) {
                                res.statusCode = 400;
                                return res.end('Missing file name');
                            }
                            // Save to "Projects/Calls Transcript" in the project root
                            const targetDir = path.join(process.cwd(), 'Projects', 'Calls Transcript');
                            if (!fs.existsSync(targetDir)) {
                                fs.mkdirSync(targetDir, { recursive: true });
                            }
                            const filePath = path.join(targetDir, fileName);
                            const buffer = Buffer.concat(body);
                            fs.writeFileSync(filePath, buffer);
                            res.statusCode = 200;
                            res.end(JSON.stringify({ success: true, path: filePath }));
                        });
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
