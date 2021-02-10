import express from 'express';
import morgan from "morgan";
import { createProxyMiddleware } from 'http-proxy-middleware';
import {
  anOpenApiSpec,
  OpenApiSpecBuilder,
} from '@loopback/openapi-spec-builder';
import swaggerParser from 'swagger-parser';
import UrlPattern from 'url-pattern'
// Create Express Server
const app = express();
const spec = anOpenApiSpec()

// Configuration
const PORT = 3000;
const HOST = "localhost";
const API_SERVICE_URL = "https://petstore.swagger.io/";

// Logging
app.use(morgan('dev'));

// Info GET endpoint
app.get('/info', (req, res, next) => {
  res.send(spec.build());
});

function regExMatchOfPath(apiPath, rPath) {
  const options = {
    optionalSegmentStartChar: "{",
    optionalSegmentEndChar: "}",
  };
  const pattern = new UrlPattern(apiPath.replace(/\/{/g, "{/:"), options);
  return pattern.match(rPath);
}


app.get('/original',async (req, res) => {
  const swaggerInfo = await swaggerParser.validate("https://petstore.swagger.io/v2/swagger.json");
  const covered = spec.build();

  const basePath = swaggerInfo.basePath

  const apiPaths = Object.entries(swaggerInfo.paths)

  const testsCoveredApis = Object.keys(covered.paths)


  const apiCovList = apiPaths.map(apiPath => {
    const swaggerPath = `${basePath}${apiPath[0]}`

    const coveredPath = testsCoveredApis.find(path => {
      return regExMatchOfPath(swaggerPath, path);
    })

    const coverageResult = {
      path: swaggerPath,
      covered: false
    }

    if (coveredPath){
      coverageResult.covered = true
    }

    return coverageResult
  });
  
  res.send(apiCovList)
})

function proxyReq(proxyReq, req, res) {
  // add custom header to request

  const method = proxyReq.method.toLowerCase()
  const path = proxyReq.path
  spec.withOperation(method, path)
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