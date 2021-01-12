const app = require('./app');
require('./database');

async function init() {
    await app.listen(3000);
    console.log('server con port 3000')
}

init();