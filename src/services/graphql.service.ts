import fetch from 'node-fetch';

export async function graphqlFetch(originUrl, body) {
    const res = await fetch(originUrl, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'content-type': 'application/json',
        },
    });
    if (!res.ok) throw Error(`${res.status} ${res.statusText}\n${await res.text()}`);
    return res.json();
}
