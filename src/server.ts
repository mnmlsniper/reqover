import 'dotenv/config';
import App from './app';
import SwaggerRoute from './routes/swagger.route';
import GraphQLRoute from './routes/graphql.route';
import validateEnv from './utils/validateEnv';

validateEnv();

const app = new App([new SwaggerRoute(), new GraphQLRoute()]);

app.listen();
