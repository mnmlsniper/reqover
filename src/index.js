import express from 'express';
import morgan from "morgan";
import { createProxyMiddleware } from 'http-proxy-middleware';
import {
  anOpenApiSpec,
  OpenApiSpecBuilder,
} from '@loopback/openapi-spec-builder';

// Create Express Server
const app = express();
const spec = anOpenApiSpec()

// Configuration
const PORT = 3000;
const HOST = "localhost";
const API_SERVICE_URL = "https://petstore.swagger.io/v2/";

// Logging
app.use(morgan('dev'));

// Info GET endpoint
app.get('/info', (req, res, next) => {
  res.send(spec.build());
});


function proxyReq(proxyReq, req, res) {
  // add custom header to request
  spec.withOperationReturningString(proxyReq.method.toLowerCase(), proxyReq.path)
  // or log the req
}

// Proxy endpoints
app.use('/', createProxyMiddleware({
  target: API_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
      [`^/`]: '',
  },
  onProxyReq: proxyReq
}));

// Start the Proxy
app.listen(PORT, HOST, () => {
  console.log(`Starting Proxy at ${HOST}:${PORT}`);
});