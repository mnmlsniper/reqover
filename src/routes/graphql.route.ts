import {Router} from 'express';
import GrapqhQLController from '../controllers/graphql.controller';
import {graphqlHTTP} from 'express-graphql';
import {execute} from 'graphql';
import {GRAPHQL_SCHEMA} from '../config/constants';

class GraphQLRoute {
    public router = Router();
    public graphqlController = new GrapqhQLController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/reqover/graphql-coverage', this.graphqlController.coverage);
        this.router.get('/reqover/graphiql', this.graphqlController.graphql);
        this.router.post('/reqover/graphql', this.graphqlController.graphql);
        this.router.get('/reqover/graphql', this.graphqlController.graphql);
        this.router.get('/reqover/graphql/schema', this.graphqlController.getIntrospectionSchema);
        this.router.post('/reqover/graphql/config', this.graphqlController.saveConfig);
        this.router.get('/reqover/graphql/report', this.graphqlController.graphqlReport);
    }
}

export default GraphQLRoute;
