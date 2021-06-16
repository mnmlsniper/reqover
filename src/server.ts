import 'dotenv/config';
import App from './app';
import SwaggerRoute from './routes/swagger.route';
import GraphQLRoute from './routes/graphql.route';
import ProjectRoute from './routes/project.route';
import validateEnv from './utils/validateEnv';

validateEnv();

const app = new App([new SwaggerRoute(), new GraphQLRoute(), new ProjectRoute()]);

app.listen();
