import {Router} from 'express';
import GrapqhQLController from '../controllers/graphql.controller';

class GraphQLRoute {
    public router = Router();
    public graphqlController = new GrapqhQLController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/graphql-coverage', this.graphqlController.coverage);
    }
}

export default GraphQLRoute;
