import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import compression from 'compression';
import {logger} from './utils/logger';
import {createProxyMiddleware} from 'http-proxy-middleware';
import {API_SERVICE_URL, PROXY_MODE} from './config/constants';
import isUrl from 'is-url';
import urlParse from 'url-parse';
import querystring from 'querystring';

export const spec = [];

class App {
    public app: express.Application;
    public port: string | number;
    public env: string;

    constructor(routes: any[]) {
        this.app = express();
        this.app.set('view engine', 'ejs');
        this.port = process.env.PORT;
        this.env = process.env.NODE_ENV;

        this.initializeMiddlewares();
        this.initializeRoutes(routes);

        this.app.use(
            '/',
            createProxyMiddleware(this.filter, {
                target: API_SERVICE_URL,
                changeOrigin: true,
                pathRewrite: {
                    [`^/`]: '',
                },
                onProxyReq: proxyReq,
                onProxyRes: proxyRes,
                router: (req) => {
                    let target = `${req.protocol}://${req.hostname}`;
                    if (PROXY_MODE === 'false') {
                        target = API_SERVICE_URL;
                    }

                    logger.info(`Router target ${target}`);
                    return target;
                },
            }),
        );
    }

    public filter(pathname, req) {
        if (pathname == '/favicon.ico') {
            return false;
        }
        return true;
    }

    public listen() {
        this.app.listen(this.port, () => {
            logger.info(`🚀 App listening on the port ${this.port}`);
        });
    }

    public getServer() {
        return this.app;
    }

    private initializeMiddlewares() {
        if (this.env === 'production') {
            this.app.use(morgan('combined'));
        } else if (this.env === 'development') {
            this.app.use(morgan('dev'));
        }

        this.app.use(hpp());
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(express.json());
        // this.app.use(express.urlencoded({extended: true}));
        this.app.use(express.static('vendor'));
    }

    private initializeRoutes(routes: any[]) {
        routes.forEach((route) => {
            this.app.use('/', route.router);
        });
    }
}

const proxyReq = (proxyReq, req, next) => {
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

const proxyRes = (proxyRes, req, res) => {
    const method = req.method;
    const responseStatus = `${proxyRes.statusCode}`;
    const path = getPath(req);
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

function getPath(req) {
    const originalUrl = req.originalUrl.split('?')[0];
    if (isUrl(originalUrl)) {
        return urlParse(originalUrl).pathname;
    }
    return originalUrl;
}

export default App;
