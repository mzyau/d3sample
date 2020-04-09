const { getIntrospectionQuery } = require ('graphql');
const { buildClientSchema } = require ('graphql');
const { buildSchema } = require ('graphql');
const { printSchema } = require ('graphql');
const fs = require('fs');
const path = require('path');
const graphURL = "https://worldcup-graphql.now.sh/";
// const graphURL = "https://polaris.shopify.com/api";
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
      res.locals.schema = JSON.stringify(data, null, 2); 
      fs.writeFileSync(path.resolve(__dirname, 'schema.json'), res.locals.schema);
    })
    .then(() => next());
};

// converts schema into an object of Types and their respective fields (along with references to other Types)
// output is in format e.g.:

controller.convertSchema = (req, res, next) => {
  const sourceSchema = JSON.parse(res.locals.schema);
  const cleanedSchema = cleanSchema(sourceSchema);
  const d3Json = schemaToD3(cleanedSchema);
  // Writes and saves the JSON file into root folder
  fs.writeFileSync(path.resolve(__dirname, 'd3schema.json'), JSON.stringify(d3Json, null, 2));
  // Stores the file path for future middleware to access to implement in d3
  res.locals.path = path.resolve(__dirname, 'd3schema.json');
  return next();
};

// cleanSchema cleans the schema received from the client's graphQL endpoint into format:
/*
{
  Query: [
    'info',
    { teams: 'Team' },
    { players: 'Player' },
    { games: 'Fixture' },
    { fixtures: 'Fixture' }
  ],
  ....
  Result: [ 'goalsHomeTeam', 'goalsAwayTeam' ]
}
*/
function cleanSchema(sourceSchema) {
  const schemaTypes = sourceSchema.data.__schema.types;
  const types = {};
  for (let i = 0; i < schemaTypes.length; i++) {
  // iterate only through relevant types (tables)
    if (schemaTypes[i].fields !== null && schemaTypes[i].name.indexOf('__') === -1) {
      const fieldsList = [];
      // Iterate through the fields array of each type (table)
      for (let j = 0; j < schemaTypes[i].fields.length; j++) {
        if (schemaTypes[i].fields[j].name && !schemaTypes[i].fields[j].isDeprecated) {
          // checks if the type of a field references another Type 
          if (schemaTypes[i].fields[j].type.kind === 'OBJECT') {
            const fieldsLink = {};
            fieldsLink[schemaTypes[i].fields[j].name] = schemaTypes[i].fields[j].type.name;
            fieldsList.push(fieldsLink);
          } else if (schemaTypes[i].fields[j].type.ofType && schemaTypes[i].fields[j].type.ofType.ofType) {
            // creates a key-value pair of relationship between the field name and the Type if it points to another Type
            const fieldsLink = {};
            fieldsLink[schemaTypes[i].fields[j].name] = schemaTypes[i].fields[j].type.ofType.ofType.name;
            fieldsList.push(fieldsLink);
          } else {
            fieldsList.push(schemaTypes[i].fields[j].name);
          }
        }
      }
      types[schemaTypes[i].name] = fieldsList;
    }
  }
  return types;
}

// schemaToD3 converts the "cleaned" schema into a JSON file for d3 in format:

/*
{
  nodes: [
    { name: 'Query', type: 'Type' },
    { name: 'info', type: 'field' },
    ....
  ],
  links: [
    { source: 'info', target: 'Info' },
    { source: 'Query', target: 'info' },
    ...
  ]
}

*/

function schemaToD3(cleanedSchema) {
  const d3Json = {};
  const nodesArray = [];
  const linksArray = [];
  const typesArray = Object.keys(cleanedSchema);
  // eslint-disable-next-line no-use-before-define
  for (let key in cleanedSchema) {
    const node = {};
    node.name = key;
    node.type = 'Type';
    nodesArray.push(node);
    for (let i = 0; i < cleanedSchema[key].length; i++) {
      // create nodes for fields that do not return other Types
      const fieldName = Object.keys(cleanedSchema[key][i]);
      if (typeof cleanedSchema[key][i] !== 'object') {
        const node = {};
        node.name = cleanedSchema[key][i];
        node.type = 'field';
        nodesArray.push(node);
        // create links from each Type to their fields
        const link = {};
        link.source = key;
        link.target = cleanedSchema[key][i];
        linksArray.push(link);
      } 
      else {
        const node = {};
        node.name = fieldName[0];
        node.type = 'field';
        nodesArray.push(node);
        const linkField = {};
        linkField.source = fieldName[0];
        linkField.target = cleanedSchema[key][i][fieldName];
        linksArray.push(linkField);
        const linkType = {};
        linkType.source = key;
        linkType.target = fieldName[0];
        linksArray.push(linkType);
      }
    }
  }
  d3Json.nodes = nodesArray;
  d3Json.links = linksArray;
  return d3Json;
}


module.exports = controller;