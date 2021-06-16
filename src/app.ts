import express from 'express';
import hpp from 'hpp';
import morgan from 'morgan';
import compression from 'compression';
import {logger} from './utils/logger';

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
        // this.app.use(helmet());
        this.app.use(compression());
        this.app.use(express.json({limit: '50mb'}));
        this.app.use(express.urlencoded({limit: '50mb'}));
        this.app.use(express.static('vendor'));
    }

    private initializeRoutes(routes: any[]) {
        routes.forEach((route) => {
            this.app.use('/', route.router);
        });
    }
}

export default App;
