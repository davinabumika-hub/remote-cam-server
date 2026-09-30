const http = require('http');
const { WebSocketServer } = require('ws');
const server = http.createServer((req, res) => { res.writeHead(200); res.end('ok'); });
const wss = new WebSocketServer({ server });
const rooms = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'join') {
      ws.room = String(msg.room).slice(0, 128);
      if (!rooms.has(ws.room)) rooms.set(ws.room, new Set());
      const r = rooms.get(ws.room);
      if (r.size >= 2) { ws.send(JSON.stringify({ type: 'full' })); return; }
      r.forEach(p => p.send(JSON.stringify({ type: 'peer-joined' })));
      r.add(ws);
      return;
    }
    const r = rooms.get(ws.room);
    if (r) r.forEach(p => { if (p !== ws && p.readyState === 1) p.send(raw.toString()); });
  });
  ws.on('close', () => {
    const r = rooms.get(ws.room);
    if (r) { r.delete(ws); if (!r.size) rooms.delete(ws.room); }
  });
});
server.listen(process.env.PORT || 3000);
