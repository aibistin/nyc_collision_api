const express = require('express');
const app = express();

app.get('/', (req,resp) => {
    resp.status(200).json({hello:"world"});
})

app.get('/collisions', (req,resp) => {
    console.log("Collisions Home");
    resp.send("This is Collisions Home");
})

app.listen(3000, () => {
    console.log("Hello World!");
})



