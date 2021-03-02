import {Kind, TypeInfo, print, visit, visitWithTypeInfo, buildClientSchema, getIntrospectionQuery} from 'graphql';
import fetch from 'node-fetch';

export async function graphqlFetch(originUrl) {
    const body = JSON.stringify({query: getIntrospectionQuery()});
    const res = await fetch(originUrl, {
        method: 'POST',
        body: body,
        headers: {
            'content-type': 'application/json',
            // 'x-api-key': 'da2-rkjttp2i3jds5bh4xs53ft4xpu',
            // Authorization:
            //     'eyJraWQiOiJWU1pzeHM1a2ZpNnQ5YXFcL0FVeW9CdTBLcjhFXC9BT3NhQXNBUlNOM085ZmM9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiIxMWM3MTIxMy0zYzRlLTRlM2QtOGEwZi1kODc5Nzk0MmYyYzEiLCJjb2duaXRvOmdyb3VwcyI6WyJyaXNrX2VuZ2luZWVyIiwiYWRtaW4iXSwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5ldS13ZXN0LTEuYW1hem9uYXdzLmNvbVwvZXUtd2VzdC0xX1dxZ3VXOXVFQiIsImN1c3RvbTp1aWQiOiI5YzcyNzJjMi1jYWQwLTRjNjMtYWZhNS0xZTUxZGNkYWM2MzUiLCJjb2duaXRvOnVzZXJuYW1lIjoic2VyaGlpIiwiY3VzdG9tOmFjY291bnQiOiIxYTViODM0NS1jNTRiLTQ4ZjYtOWE1ZC0wNGQzYTZhZjcyODciLCJhdWQiOiI3MXVraHR1N2ljOGlvN2w3bzhsYWZtM2RyNyIsImV2ZW50X2lkIjoiOGQ1ZjczMzEtODM1Yi00ZDEwLTk1ZDEtMzY4ZWIyNjY1Y2I3IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MTQ1ODk0NzQsImV4cCI6MTYxNDU5MzA3NCwiaWF0IjoxNjE0NTg5NDc0LCJlbWFpbCI6InNlcmhpaS5waXJvaG92QHRydXJpc2suaW8ifQ.OUUhD79HMX9QIzJi_Taiqw4P1tOr9VVyWfwnTN6PbVDFdJLSbjrLIxAJRE8vS2vVyW3i1YYC5HNToY-D5TqpZWCq56JQGJcsHXROrWvpfxlsJhCV-YcNwRf1shFmUKzi1luYDWWJ-oT0PGz_cWFIPOHs0AfvwRWprjGEI5hjcMXii87dtBO032V0NZdJSYSaobQzKehSmLYKOVh5qMqtLutcuh05Q5Mjgf6JxicSXl7bNqS34Ve_AhJVt5gYOVQV0lSIG8-uFOoZhPpy_UL8gQby6RktvJ3wFd1LNyxOHG5_Q90yrolozVpW-TuuUJUQl8VrMhxz6yc9EFYkJWmTkw',
        },
    });
    if (!res.ok) throw Error(`${res.status} ${res.statusText}\n${await res.text()}`);
    return res.json();
}
