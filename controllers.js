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
    })
    .then(() => next());
};

// converts schema into an object of Types and their respective fields (along with references to other Types)
// output is in format e.g.:
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
controller.convertSchema = (req, res, next) => {
  const sourceSchema = JSON.parse(res.locals.schema);
  const cleanedSchema = cleanSchema(sourceSchema);
  const d3Json = schemaToD3(cleanedSchema);
  // Writes and saves the JSON file into root folder
  fs.writeFileSync(path.resolve(__dirname, 'd3schema.json'), JSON.stringify(d3Json, null, 2));
  // Stores the file path for future middleware to access to implement in d3
  res.locals.path = path.resolve(__dirname, 'd3schema.json');
  console.log(d3Json);
  return next();
};

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
          if (schemaTypes[i].fields[j].type.ofType && schemaTypes[i].fields[j].type.ofType.ofType) {
            // creates a key-value pair of relationship between the field name and the type if it points to another type
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

function schemaToD3(cleanedSchema) {
  const d3Json = {};
  const nodesArray = [];
  const linksArray = [];
  // eslint-disable-next-line no-use-before-define
  for (let key in cleanedSchema) {
    const node = {};
    node.name = key;
    node.type = 'Type';
    nodesArray.push(node);
    for (let i = 0; i < cleanedSchema[key].length; i++) {
      if (typeof cleanedSchema[key][i] !== 'object') {
        const node = {};
        node.name = cleanedSchema[key][i];
        node.type = 'field';
        nodesArray.push(node);
        const link = {};
        link.source = key;
        link.target = cleanedSchema[key][i];
        linksArray.push(link);
      } else {
        const node = {};
        const fieldName = Object.keys(cleanedSchema[key][i]);
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