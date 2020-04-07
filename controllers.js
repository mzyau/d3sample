const { introspectionQuery } = require('./introspectionquery.js');
const { getIntrospectionQuery } = require ('graphql');
const { buildClientSchema } = require ('graphql');
const { buildSchema } = require ('graphql');
const { printSchema } = require ('graphql');
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
      res.locals.data = data;
      res.locals.schema = buildClientSchema(data.data);
      console.log(res.locals.schema);
    })
    .then(() => next());
};

// Builds the schema into a graphQL data file from the JSON file received from getSchema
controller.buildSchema = (req, res, next) => {
  const schemaFile = buildClientSchema(res.locals.schema);
  console.log(schemaFile);
  return next();
};

module.exports = controller;