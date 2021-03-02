import {parse} from '@apidevtools/swagger-parser';

export let API_SERVICE_URL = process.env.API_SERVICE_URL;
export let SWAGGER_SPEC_URL = process.env.SWAGGER_SPEC_URL;
export let SWAGGER_BASE_PATH = process.env.SWAGGER_BASE_PATH;
export const PROXY_MODE = process.env.PROXY_MODE;
export let GRAPHQL_URL = process.env.GRAPHQL_URL;

export function setApiSericeUrl(url) {
    API_SERVICE_URL = url;
}

export function setSwaggerUrl(url) {
    SWAGGER_SPEC_URL = url;
}

export function setBasePath(path) {
    SWAGGER_BASE_PATH = path;
}

export function setGraphQLUrl(path) {
    GRAPHQL_URL = path;
}
