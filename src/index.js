const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});
http.createServer((req, res) => {
  console.log('Request', req.method, req.url);
  proxy.web(req, res, { target: `http://httpbin.org/get?answer=42` });
}).listen(3000);