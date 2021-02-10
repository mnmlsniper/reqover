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
// const spec = anOpenApiSpec()

const spec = {
  paths: {}
}

// Configuration
const PORT = 3000;
const HOST = "localhost";
const API_SERVICE_URL = "https://petstore.swagger.io";

// Logging
app.use(morgan('dev'));

// Info GET endpoint
app.get('/info', (req, res, next) => {
  const a = Object.entries(data).forEach( ([key, value]) => {
       const specificationData = {
          parameters: [],//(ParameterObject | ReferenceObject),
          requestBody: null,//RequestBodyObject | ReferenceObject,
          responses: value.responses,
        }

        spec.withOperation(value.methodName, key, specificationData)
  })

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
  // const covered = spec.build();

  const basePath = swaggerInfo.basePath
  const coveredPaths = spec.paths
  const apiPaths = Object.entries(swaggerInfo.paths)
  const testsCoveredApis = Object.keys(coveredPaths)

  const apiCovList = apiPaths.map(([apiPath, value]) => {
    const swaggerPath = `${basePath}${apiPath}`

    const coveredPath = testsCoveredApis.find(path => {
      return regExMatchOfPath(swaggerPath, path)
    })

    let apiResponses = {}

    if (coveredPath){
      const covered = coveredPaths[coveredPath]
      Object.entries(value).forEach(([methodName, values]) => {
        console.log()
        if (methodName in covered){
          apiResponses = Object.keys(values.responses).map(resp => {
            let status = false
            const coveredResponseCode = Object.keys(covered[methodName].responses).find(r => r == resp)
            if(coveredResponseCode){
              status = true
            }
  
            return {[resp]: status}
          })
        }
      })
    }    

    const coverageResult = {
      path: swaggerPath,
      responses: apiResponses
    }

    return coverageResult
  });
  
  res.send(apiCovList)
})

function proxyReq(proxyReq, req, res) {
  // add custom header to request  
  // or log the req
}

function proxyRes(proxyRes, req, res) {
  const method = req.method.toLowerCase()
  const responseStatus = `${proxyRes.statusCode}`
  const path = req.originalUrl

  let d = spec.paths[path]
  if(d){
    d[[method]][responses][[responseStatus]] = {}
  }else {
    spec.paths[path] = {
        [method]: {responses: {
          [responseStatus]: {}
        }
      }
    }
  }
}

// Proxy endpoints
app.use('/', createProxyMiddleware({
  target: API_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
      [`^/`]: '',
  },
  onProxyReq: proxyReq,
  onProxyRes: proxyRes,
}));

// Start the Proxy
app.listen(PORT, HOST, () => {
  console.log(`Starting Proxy at ${HOST}:${PORT}`);
});