import {Router} from 'express';
import SwaggerController from '../controllers/swagger.controller';

class SwaggerRoute {
    public router = Router();
    public swaggerController = new SwaggerController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/info', this.swaggerController.info);
        this.router.get('/reqover/swagger', this.swaggerController.swaggerReport);
        this.router.get('/reqover/graphql', this.swaggerController.graphqlReport);
        this.router.get('/coverage', this.swaggerController.coverage);
        this.router.get('/specs', this.swaggerController.specs);
        this.router.get('/reset', this.swaggerController.reset);
        this.router.post('/config', this.swaggerController.saveConfig);
        this.router.get('/reqover', this.swaggerController.config);
    }
}

export default SwaggerRoute;
