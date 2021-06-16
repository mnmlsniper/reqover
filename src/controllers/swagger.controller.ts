import {NextFunction, Request, Response} from 'express';
import {SWAGGER_SPEC_URL, setApiSericeUrl, setSwaggerUrl, setBasePath, PROXY_MODE, API_SERVICE_URL} from '../config/constants';
import {getSwaggerPaths, getCoverageReport} from '../services/swagger.service';
import {createProxyMiddleware} from 'http-proxy-middleware';
import isUrl from 'is-url';
import urlParse from 'url-parse';
import querystring from 'querystring';
import {logger} from '../utils/logger';

let swaggerApiList = {};
export const spec = [];

class SwaggerController {
    public filter(pathname, req) {
        if (pathname == '/favicon.ico') {
            return false;
        }
        return true;
    }

    private proxyReq = (proxyReq, req, next) => {
        // add custom header to request
        if (!req.body || !Object.keys(req.body).length) {
            return;
        }

        const contentType = proxyReq.getHeader('Content-Type');
        const writeBody = (bodyData: string) => {
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        };

        if (contentType === 'application/json') {
            writeBody(JSON.stringify(req.body));
        }

        if (contentType === 'application/x-www-form-urlencoded') {
            writeBody(querystring.stringify(req.body));
        }
        // or log the req
    };

    private proxyRes = (proxyRes, req, res) => {
        const method = req.method;
        const responseStatus = `${proxyRes.statusCode}`;
        const path = this.getPath(req).replace('/reqover/swagger', '');
        const params = req.query;
        const queryParameters = Object.entries(params).map(([p, v]) => {
            return {name: p, value: v};
        });

        const body = req.body;

        spec.push({
            path: path,
            method: method,
            response: responseStatus,
            parameters: queryParameters,
            body: body,
        });
    };

    private getPath(req) {
        const originalUrl = req.originalUrl.split('?')[0];
        if (isUrl(originalUrl)) {
            return urlParse(originalUrl).pathname;
        }
        return originalUrl;
    }

    public swaggerApi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const middleware = createProxyMiddleware(this.filter, {
            target: API_SERVICE_URL,
            changeOrigin: true,
            pathRewrite: {
                [`^/reqover/swagger`]: '',
            },
            onProxyReq: this.proxyReq,
            onProxyRes: this.proxyRes,
            router: (req) => {
                let target = `${req.protocol}://${req.hostname}`;
                if (PROXY_MODE === 'false') {
                    target = API_SERVICE_URL;
                }

                logger.info(`Router target ${target}`);
                return target;
            },
        });
        const result = await middleware(req, res, next);
        return result;
    };

    public specs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.send(spec);
        } catch (error) {
            next(error);
        }
    };

    public reset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        spec.length = 0;
        res.send({status: 'done'});
    };

    public info = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.send(swaggerApiList);
        } catch (error) {
            next(error);
        }
    };

    public saveConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const {type, data} = req.body;

        if (type === 'swagger') {
            setApiSericeUrl(data.serviceUrl);
            setSwaggerUrl(data.specUrl);
            setBasePath(data.basePath);
        }

        try {
            swaggerApiList = await getSwaggerPaths(data.specUrl);
            res.send({done: 'ok'});
        } catch (error) {
            res.status(404).send({error: error.message});
        }
    };

    public config = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        res.render('main', {apiUrl: API_SERVICE_URL, specUrl: SWAGGER_SPEC_URL, graphqlUrl: ''});
    };

    public swaggerReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (Object.keys(swaggerApiList).length == 0) {
            res.redirect('/');
        }

        try {
            const reportData = await getCoverageReport(swaggerApiList);
            res.render('index', {data: reportData});
        } catch (error) {
            res.redirect('/');
        }
    };

    public coverage = async (req: any, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.send(await getCoverageReport(swaggerApiList));
        } catch (error) {
            next(error);
        }
    };
}

export default SwaggerController;
