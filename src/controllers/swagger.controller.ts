import {NextFunction, Request, Response} from 'express';
import {spec} from '../app';
import {SWAGGER_SPEC_URL, setApiSericeUrl, setSwaggerUrl, setBasePath, setGraphQLUrl, API_SERVICE_URL} from '../config/constants';
import {getSwaggerPaths, getCoverageReport} from '../services/swagger.service';
import {graphqlFetch} from '../services/graphql.service';

let swaggerApiList = [];
let schema = {};

class SwaggerController {
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
        } else {
            setGraphQLUrl(data.graphqlUrl);
        }

        try {
            if (type === 'swagger') {
                swaggerApiList = await getSwaggerPaths(data.specUrl);
            } else {
                schema = await graphqlFetch(data.graphqlUrl);
            }
            res.send({done: 'ok'});
        } catch (error) {
            res.status(404).send({error: error.message});
        }
    };

    public config = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        res.render('main', {apiUrl: API_SERVICE_URL, specUrl: SWAGGER_SPEC_URL, graphqlUrl: ''});
    };

    public swaggerReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (swaggerApiList.length == 0) {
            res.redirect('/config');
        }

        try {
            const reportData = await getCoverageReport(swaggerApiList);
            res.render('index', {data: reportData});
        } catch (error) {
            res.redirect('/config');
        }
    };

    public graphqlReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (Object.keys(schema).length == 0) {
            res.redirect('/config');
        }

        try {
            res.render('graphql');
        } catch (error) {
            res.redirect('/config');
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
