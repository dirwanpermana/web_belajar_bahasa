// Versi Netlify Functions dari api/ai.js (dipetakan ke /api/ai lewat netlify.toml).
const handler = require('../../api/ai.js');
exports.handler = async event => {
  let status = 200, headers = {}, out = '';
  const res = {
    setHeader: (k, v) => { headers[k] = v; },
    status(c) { status = c; return this; },
    json(o) { headers['content-type'] = 'application/json'; out = JSON.stringify(o); return this; },
    end() { return this; }
  };
  const req = { method: event.httpMethod, headers: Object.fromEntries(Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v])), body: event.body };
  await handler(req, res);
  return { statusCode: status, headers, body: out };
};
