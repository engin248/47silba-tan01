const http = require('http');

const data = JSON.stringify({
    ajanTipi: 'KAMERA_GIZLI_EDGE',
    kameraId: 1,
    kameraAdi: 'Dikim',
    sebep: '2_DK_IDLE'
});

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/ajan-tetikle',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': 'internal-sb47-api-key-degistirin-2026-ZpR3nW',
        'Content-Length': data.length
    }
}, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => console.log(`BODY: ${chunk}`));
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
