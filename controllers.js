const { getIntrospectionQuery } = require ('graphql');
const { buildClientSchema } = require ('graphql');
const { buildSchema } = require ('graphql');
const { printSchema } = require ('graphql');
const fs = require('fs');
const path = require('path');
const graphURL = "https://worldcup-graphql.now.sh/";
const fetch = require('node-fetch');

const controller = {};

// Using introspection to retrieve the schema from a given graphQL endpoint, expects graphQL string endpoint in the req.body
// for now, have manually defined the URL as worldcup endpoint in line 5
controller.getSchema = (req, res, next) => {
  // const {graphURL} = req.body;
  fetch(graphURL, {
    method: "Post",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({"query": getIntrospectionQuery()}),
  })
    .then(res => res.json())
    .then(data => {
      res.locals.schema = JSON.stringify(data, null, 2); // put " data cleaning" function in 2nd parameter of stringify
      // Writes and saves the JSON file retrieved from introspection query into root folder
      fs.writeFileSync(path.resolve(__dirname, "schema.json"), res.locals.schema);
      // Stores the file path for future middleware to access to implement in d3
      res.locals.path = path.resolve(__dirname, "schema.json");
    })
    .then(() => next());
};


module.exports = controller;