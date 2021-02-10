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

function getCovered(swaggerPath, coveredPaths){
  const result = {}
  coveredPaths.forEach(path => {
      Object.entries(path[1]).forEach(([methodName, data]) => {
        const coveredResponses = Object.keys(data.responses)
        const coveredParameters = data.parameters

        if (swaggerPath in result){
          result[swaggerPath][methodName].responses.push(...coveredResponses)
          result[swaggerPath][methodName].parameters.push(...coveredParameters)
        } else {
           result[swaggerPath] = {
             [methodName]: {
               responses: [...coveredResponses],
               parameters: coveredParameters
             }
           }
        }
      })
  })
  return result
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

function calculateResponsesCoverage(coveredResponses, swaggerResponses){
  const expectedResponses = Object.keys(swaggerResponses)

  return expectedResponses.map(r => {
          let status = false
          if (coveredResponses?.includes(r)){
            status = true
          }

          return {[r]: status}
  })
}

function calculateParametersCoverage(coveredParameters, swaggerParameters){
   const swaggerParams = swaggerParameters.map((p) => {
     return  { 
       name: p.name,
       in: p.in,
       type: p.type, 
       required: p.required,
       options: p.items?.enum,
       covered: false
      } 
   })
   return swaggerParams
}

app.get('/cov',async (req, res) => {
  const swaggerInfo = await swaggerParser.validate("https://petstore.swagger.io/v2/swagger.json");
  
  const basePath = swaggerInfo.basePath
  const coveredPaths = spec.paths
  const apiPaths = Object.entries(swaggerInfo.paths)
  const testsCoveredApis = Object.entries(coveredPaths)

  const apiCovList = apiPaths.map(([apiPath, value]) => {
    const swaggerPath = `${basePath}${apiPath}`

    const coveredPaths = testsCoveredApis.filter(path => {
      return regExMatchOfPath(swaggerPath, path[0])
    })

    const coverageResult = getCovered(swaggerPath, coveredPaths)

    if(isEmpty(coverageResult)){
      const expected = {}
      Object.entries(value).forEach(([methodName, data]) => {
          const expectedResponses = Object.keys(data.responses)
          const responseCoverageResult = expectedResponses.map(r => {
            return {[r]: false}
          })
          
          const parametersCoverage = calculateParametersCoverage([], data.parameters)

          expected[methodName] = {
            responses: responseCoverageResult,
            parameters: parametersCoverage
          }
      })

      return {[apiPath]:expected}
    }

    const expected = {}
    Object.entries(value).forEach(([methodName, data]) => {
        const coveredResponses = coverageResult[swaggerPath][methodName]?.responses
        const responseCoverage = calculateResponsesCoverage(coveredResponses, data.responses)

        const coveredParameters = coverageResult[swaggerPath][methodName]?.parameters
        const parametersCoverage = calculateParametersCoverage(coveredParameters, data.parameters)

        expected[methodName] = {
          responses: responseCoverage,
          parameters: parametersCoverage
        }
    })

    return {
      [apiPath]:expected
    }
  })

  res.send(apiCovList)
})

function proxyReq(proxyReq, req, res) {
  // add custom header to request  
  // or log the req
}

function proxyRes(proxyRes, req, res) {
  const method = req.method.toLowerCase()
  const responseStatus = `${proxyRes.statusCode}`
  const path = req.originalUrl.split('?')[0]
  const params = req.query

  if(spec.paths[path]){
    spec.paths[path][method].responses[responseStatus] = {}
    spec.paths[path][method].parameters.push(params)
  }else {
    spec.paths[path] = {
        [method]: {
          responses: {[responseStatus]: {}},
          parameters: [params]
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