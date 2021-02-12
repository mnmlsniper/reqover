import 'dotenv/config';
import App from './app';
import SwaggerRoute from './routes/swagger.route';
import validateEnv from './utils/validateEnv';

validateEnv();

const app = new App([new SwaggerRoute()]);

app.listen();
