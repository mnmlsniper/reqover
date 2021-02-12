import {NextFunction, Request, Response} from 'express';
import swaggerParser from '@apidevtools/swagger-parser';
import UrlPattern from 'url-pattern';
import {spec} from '../app';

class AuthController {
    private readonly SWAGGER_SPEC = process.env.SWAGGER_SPEC || 'https://petstore.swagger.io/v2/swagger.json';

    public specs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.send(spec);
        } catch (error) {
            next(error);
        }
    };

    public info = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const apiList = await this.getSwaggerPaths(this.SWAGGER_SPEC);
            res.send(apiList);
        } catch (error) {
            next(error);
        }
    };

    public report = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const reportData = await this.getCoverageReport(this.SWAGGER_SPEC);
            res.render('index', {data: reportData});
        } catch (error) {
            next(error);
        }
    };

    public coverage = async (req: any, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.send(await this.getCoverageReport(this.SWAGGER_SPEC));
        } catch (error) {
            next(error);
        }
    };

    private getSwaggerPaths = async (swaggerSpec: any) => {
        const swaggerInfo: any = await swaggerParser.validate(swaggerSpec);
        const basePath = swaggerInfo.basePath;
        const apiPaths = Object.entries(swaggerInfo.paths);

        const apiList = apiPaths.map(([apiPath, value]) => {
            const methods = Object.entries(value).map(([methodName, data]) => {
                return {
                    path: `${basePath}${apiPath}`,
                    name: methodName.toUpperCase(),
                    responses: Object.keys(data.responses),
                    parameters: data.parameters,
                };
            });

            return {
                path: `${basePath}${apiPath}`,
                methods: methods,
            };
        });

        return apiList;
    };

    private getCoverageReport = async (swaggerSpec: any) => {
        const apiList = await this.getSwaggerPaths(swaggerSpec);

        const apiCovList: any = apiList.map((apiItem) => {
            const coveredApis = this.findCoveredApis(apiItem);

            const coveredMethods = apiItem.methods.map((method) => {
                const coveredMethods: any = coveredApis.filter((c) => c.method == method.name);
                const coveredStatusCodes = [...new Set(coveredMethods.map((m) => m.response))];
                const missingStatusCodes = method.responses.filter((s) => !coveredStatusCodes.includes(s));

                const coveredParameters = coveredMethods
                    .map((m) => {
                        return m.parameters.map((p) => p.name);
                    })
                    .flat();
                const missingParameters = method.parameters
                    .map((p) => {
                        return {
                            name: p.name,
                            required: p.required,
                            in: p.in,
                            type: p.type,
                        };
                    })
                    .map((mp) => mp.name)
                    .filter((m) => !coveredParameters.includes(m));

                const coverage = ((coveredStatusCodes.length / (coveredStatusCodes.length + missingStatusCodes.length)) * 100).toFixed();

                let status = 'danger';
                if (+coverage > 0 && +coverage < 100) {
                    status = 'warning';
                } else {
                    status = 'success';
                }

                return {
                    path: apiItem['path'],
                    method: method.name,
                    coverage: coverage,
                    status: status,
                    responses: {
                        missed: missingStatusCodes,
                        covered: coveredStatusCodes,
                    },
                    parameters: {
                        missed: missingParameters,
                        covered: coveredParameters,
                    },
                };
            });

            return coveredMethods;
        });

        return apiCovList.flat();
    };

    private regExMatchOfPath = (apiPath: string, rPath: string) => {
        const pattern = new UrlPattern(apiPath.replace(/\/{/g, '{/:'), {
            optionalSegmentStartChar: '{',
            optionalSegmentEndChar: '}',
        });
        return pattern.match(rPath);
    };

    private findCoveredApis = (apiItem: any) => {
        return spec.filter((path) => {
            return this.regExMatchOfPath(apiItem['path'], path['path']);
        });
    };
}

export default AuthController;
