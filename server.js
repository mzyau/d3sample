const express = require ('express');
const path = require('path');
const PORT = 3000;
const app = express();
const controller = require('./controllers.js');

app.use(express.static('../d3sample'));
app.get('/', (req, res, next) => {
  res.sendFile(path.resolve(__dirname, './index.html'));
});

// Gets the schema as a JSON file by fetching from the client-provided graphQL endpoint
app.get('/getschema', controller.getSchema, controller.convertSchema, (req,res, next) => {
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));

