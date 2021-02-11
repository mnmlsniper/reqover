import express from 'express';
import morgan from "morgan";
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerParser from 'swagger-parser';
import UrlPattern from 'url-pattern'
// Create Express Server
const app = express();
// const spec = anOpenApiSpec()
app.set("view engine", "ejs");

const spec = []

// Configuration
const PORT = 3000;
const HOST = "localhost";
const API_SERVICE_URL = "https://petstore.swagger.io";

// Logging
app.use(morgan('dev'));

// Info GET endpoint
app.get('/info', async (req, res, next) => {
  const apiList = await getSwaggerPaths("https://petstore.swagger.io/v2/swagger.json")
  res.send(apiList)
});

async function getSwaggerPaths(swaggerSpec){
  const swaggerInfo = await swaggerParser.validate(swaggerSpec);
  const basePath = swaggerInfo.basePath
  const apiPaths = Object.entries(swaggerInfo.paths)
  
  const apiList = apiPaths.map(([apiPath, value]) => {
    const methods = Object.entries(value).map(([methodName, data]) => {
      return {
        path: `${basePath}${apiPath}`,
        name: methodName.toUpperCase(),
        responses: Object.keys(data.responses),
        parameters: data.parameters
      }
    });
    
    return {
        path: `${basePath}${apiPath}`,
        methods: methods
    }
  });

  return apiList
}


function regExMatchOfPath(apiPath, rPath) {
  const options = {
    optionalSegmentStartChar: "{",
    optionalSegmentEndChar: "}",
  };
  const pattern = new UrlPattern(apiPath.replace(/\/{/g, "{/:"), options);
  return pattern.match(rPath);
}

app.use('/report', async (req, res) => {
  const reportData = await getCoverageReport()
  res.render('index', { data: reportData })
})

function findCoveredApis(apiItem){
  return spec.filter(path => {
    return regExMatchOfPath(apiItem['path'], path['path'])
  })
}

async function getCoverageReport(){
  const apiList = await getSwaggerPaths("https://petstore.swagger.io/v2/swagger.json")

  const apiCovList = apiList.map(apiItem => {
    const coveredApis = findCoveredApis(apiItem)

    const coveredMethods = apiItem.methods.map(method => {
      const coveredMethods = coveredApis.filter(c => c.method == method.name)
      const coveredStatusCodes = coveredMethods.map(m => m.response)
      const missingStatusCodes = method.responses.filter(s => !coveredStatusCodes.includes(s));

      const coveredParameters = coveredMethods.map(m => { return m.parameters.map(p=> p.name)}).flat()
      const missingParameters = method.parameters.map(p => { 
        return {
          name: p.name,
          required: p.required,
          in: p.in,
          type: p.type
        }
      }).map(mp => mp.name)
      .filter(m => !coveredParameters.includes(m))

      return {
        path: apiItem['path'],
        method: method.name,
        responses: {
          missed: missingStatusCodes,
          covered: [...new Set(coveredStatusCodes)]
        },
        parameters: {
          missed: missingParameters,
          covered: coveredParameters
        }
      }
    })

    return coveredMethods
  })

  return apiCovList.flat()
}

app.get('/cov', async (req, res) => {
  res.send(await getCoverageReport())
})

function proxyReq(proxyReq, req, res) {
  // add custom header to request  
  // or log the req
}

function proxyRes(proxyRes, req, res) {
  const method = req.method
  const responseStatus = `${proxyRes.statusCode}`
  const path = req.originalUrl.split('?')[0]
  const params = req.query
  const queryParameters = Object.entries(params).map(([p, v]) => { return {name: p, value: v} })

  spec.push({
    path: path,
    method: method,
    response: responseStatus,
    parameters: queryParameters
  })
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