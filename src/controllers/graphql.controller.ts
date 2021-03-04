import {NextFunction, Request, Response} from 'express';
import {GRAPHQL_SCHEMA} from '../config/constants';
import {graphqlHTTP} from 'express-graphql';
import {Kind, TypeInfo, print, visit, visitWithTypeInfo, GraphQLSchema, buildClientSchema, getIntrospectionQuery} from 'graphql';
import {graphqlFetch} from '../services/graphql.service';

const coverage = {};
let graphQLSchema: GraphQLSchema = null;
let graphqlApiUrl = null;
let headers = {};

class GrapqhQLController {
    public coverage = async (req: any, res: Response, next: NextFunction): Promise<void> => {
        res.send(coverage);
    };

    public schema = async (req: any, res: Response, next: NextFunction): Promise<void> => {
        res.send(GRAPHQL_SCHEMA);
    };

    public graphqlReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (graphQLSchema && Object.keys(graphQLSchema).length == 0) {
            res.redirect('/reqover');
        }

        try {
            res.render('graphql');
        } catch (error) {
            res.redirect('/reqover');
        }
    };

    public graphql = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        headers = req.headers;
        const middleware = graphqlHTTP({schema: graphQLSchema, graphiql: true, customFormatErrorFn: (err) => err, customExecuteFn: this.execute});
        const result = await middleware(req, res);
        return result;
    };

    public getIntrospectionSchema = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const middleware = graphqlHTTP({schema: graphQLSchema, graphiql: true, customFormatErrorFn: (err) => err, customExecuteFn: this.getSchema});
        const result = await middleware(req, res);
        return result;
    };

    public saveConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const graphqlUrl = req.body.data.graphqlUrl;
        headers = {'content-type': 'application/json', ...req.body.data.headers};
        try {
            const {errors, data} = await graphqlFetch(graphqlUrl, {query: getIntrospectionQuery()}, headers);
            graphQLSchema = buildClientSchema(data);
            graphqlApiUrl = graphqlUrl;
            res.send({done: 'ok'});
        } catch (error) {
            res.status(404).send({error: error.message});
        }
    };

    private async getSchema({schema, document, variableValues: variables, operationName}) {
        return await graphqlFetch(
            graphqlApiUrl,
            {
                query: print(document),
                variables,
                operationName,
            },
            headers,
        );
    }

    private async execute({schema, document, variableValues: variables, operationName}) {
        const typeInfo = new TypeInfo(schema);
        visit(
            document,
            visitWithTypeInfo(typeInfo, {
                [Kind.FIELD]: () => {
                    const typeName = typeInfo.getParentType().name;
                    const fieldName = typeInfo.getFieldDef().name;
                    if (typeName.startsWith('__') || fieldName.startsWith('__')) return;
                    coverage[`${typeName}::${fieldName}`] = true;
                },
            }),
        );

        delete headers['host'];
        const resp = await graphqlFetch(
            graphqlApiUrl,
            {
                query: print(document),
                variables,
                operationName,
            },
            headers,
        );

        return resp;
    }
}

export default GrapqhQLController;
