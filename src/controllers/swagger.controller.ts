import {NextFunction, Request, Response} from 'express';
import {spec} from '../app';
import {SWAGGER_SPEC_URL, setApiSericeUrl, setSwaggerUrl, setBasePath, API_SERVICE_URL} from '../config/constants';
import {getSwaggerPaths, getCoverageReport} from '../services/swagger.service';

let swaggerApiList = [];

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
        const {serviceUrl, specUrl, basePath} = req.body;
        setApiSericeUrl(serviceUrl);
        setSwaggerUrl(specUrl);
        setBasePath(basePath);
        try {
            swaggerApiList = await getSwaggerPaths(specUrl);
            res.send({done: 'ok'});
        } catch (error) {
            res.status(404).send({error: error.message});
        }
    };

    public config = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        res.render('main', {apiUrl: API_SERVICE_URL, specUrl: SWAGGER_SPEC_URL, graphqlUrl: ''});
    };

    public report = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    public coverage = async (req: any, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.send(await getCoverageReport(swaggerApiList));
        } catch (error) {
            next(error);
        }
    };
}

export default SwaggerController;
