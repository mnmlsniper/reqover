import swaggerParser from '@apidevtools/swagger-parser';
import {SWAGGER_BASE_PATH, API_SERVICE_URL, SWAGGER_SPEC_URL} from '../config/constants';
import UrlPattern from 'url-pattern';
import merge from 'deepmerge';
import {spec} from '../app';
import _ from 'lodash';

export async function getSwaggerPaths(swaggerSpec: any) {
    const swaggerInfo: any = await swaggerParser.parse(swaggerSpec);
    const {basePath, paths} = swaggerInfo;
    const apiPaths = Object.entries(paths);
    const tags = swaggerInfo.tags?.map((t) => t.name) || ['default'];
    const apiList = apiPaths.map(([apiPath, value]) => {
        let path = `${apiPath}`;
        if (!basePath) {
            path = `${SWAGGER_BASE_PATH}${apiPath}`;
        } else {
            path = `${basePath}${apiPath}`;
        }

        const methods = Object.entries(value).map(([methodName, data]) => {
            const {responses, parameters} = data;
            const tags = data.tags || ['default'];
            return {
                path: path,
                tags: tags,
                name: methodName.toUpperCase(),
                responses: Object.keys(responses),
                parameters: parameters ? parameters : [],
            };
        });

        return {path: path, methods};
    });

    return {tags: tags, apiList: apiList};
}

export async function getCoverageReport(apiData) {
    const swaggerUrls = apiData.apiList.map((u: any) => u.path);

    const apiCovList: any = apiData.apiList.map((apiItem) => {
        const coveredApis = findCoveredApis(apiItem, swaggerUrls);

        const coveredMethods = apiItem.methods.map((method) => {
            const {name, responses, parameters} = method;
            const coveredMethodNames: any = coveredApis.filter((c) => c.method == name);

            const coveredStatusCodes = [...new Set(coveredMethodNames.map((m) => m.response))];
            const missingStatusCodes = responses.filter((s) => !coveredStatusCodes.includes(s));

            let requestsCount = 0;
            let bodies = [];
            if (coveredMethodNames.length > 0) {
                const covered = coveredApis.filter((a) => a.method === method.name);
                requestsCount = covered.length;
                bodies = covered.map((ca) => ca.body).filter((b) => b && Object.keys(b).length > 0);
            }

            const coveredParameters = [
                ...new Set(
                    coveredMethodNames
                        .map((m) => {
                            return m.parameters.map((p) => p.name);
                        })
                        .flat(),
                ),
            ];

            if (bodies.length > 0) {
                coveredParameters.push('body');
            }

            const missingParameters = parameters
                .map(({name, required, type, ...p}) => {
                    return {name, required, in: p.in, type};
                })
                .map((mp) => mp.name)
                .filter((m) => !coveredParameters.includes(m));

            const coverage = +((coveredStatusCodes.length / (coveredStatusCodes.length + missingStatusCodes.length)) * 100).toFixed();

            let status = 'danger';
            status = +coverage > 0 && +coverage < 100 ? 'warning' : 'success';

            return {
                path: apiItem['path'],
                tags: method.tags,
                requests: requestsCount,
                method: name,
                coverage,
                status,
                responses: {
                    missed: missingStatusCodes,
                    covered: coveredStatusCodes,
                },
                parameters: {
                    missed: missingParameters,
                    covered: coveredParameters,
                },
                bodies: bodies,
                mergedBody: mergeBody(bodies),
            };
        });

        return coveredMethods;
    });

    const result = apiCovList.flat();

    const tags = apiData.tags;

    const missing = result.filter((res) => res.coverage == 0);
    const partial = result.filter((res) => res.coverage != 0 && res.coverage < 100);
    const full = result.filter((res) => res.coverage == 100);

    var all = _.mapValues(_.groupBy(result, 'tags'), (clist) => clist.map((res) => _.omit(res, 'tags')));
    var missed = _.mapValues(_.groupBy(missing, 'tags'), (clist) => clist.map((res) => _.omit(res, 'tags')));
    var partially = _.mapValues(_.groupBy(partial, 'tags'), (clist) => clist.map((res) => _.omit(res, 'tags')));
    var fully = _.mapValues(_.groupBy(full, 'tags'), (clist) => clist.map((res) => _.omit(res, 'tags')));

    return {
        apiUrl: API_SERVICE_URL,
        swaggerSpecUrl: SWAGGER_SPEC_URL,
        tags: tags,
        summary: {
            operations: {
                missing: +((missing.length / result.length) * 100).toFixed(),
                partial: +((partial.length / result.length) * 100).toFixed(),
                full: +((full.length / result.length) * 100).toFixed(),
            },
        },
        all: {size: result.length, items: all},
        missing: {size: missing.length, items: missed},
        partial: {size: partial.length, items: partially},
        full: {size: full.length, items: fully},
    };
}

const findCoveredApis = (apiItem: any, swaggerUrls: any) => {
    const apiPath = apiItem['path'];
    return spec
        .filter((path) => {
            const currentPath = path['path'];
            if (apiPath != currentPath && isSwaggerUrl(swaggerUrls, currentPath)) {
                return false;
            }

            return regExMatchOfPath(apiPath, currentPath);
        })
        .map((api) => {
            console.log();
            const currentPath = api['path'];
            const match = regExMatchOfPath(apiPath, currentPath);
            if (match) {
                api.parameters.push(
                    ...Object.keys(match).map((k) => {
                        return {name: k};
                    }),
                );
            }

            return {
                ...api,
            };
        });
};

function isSwaggerUrl(swaggerUrls, path): boolean {
    return swaggerUrls.includes(path);
}

const regExMatchOfPath = (apiPath: string, rPath: string) => {
    return new UrlPattern(apiPath.replace(/\/{/g, '{/:'), {
        optionalSegmentStartChar: '{',
        optionalSegmentEndChar: '}',
        segmentNameCharset: 'a-zA-Z0-9_-',
    }).match(rPath);
};

function mergeBody(bodies: any[]) {
    const combineMerge = (target, source, options) => {
        const destination = target.slice();

        source.forEach((item, index) => {
            if (typeof destination[index] === 'undefined') {
                destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
            } else if (options.isMergeableObject(item)) {
                destination[index] = merge(target[index], item, options);
            } else if (target.indexOf(item) === -1) {
                destination.push(item);
            }
        });
        return destination;
    };

    return merge.all(bodies, {arrayMerge: combineMerge});
}
