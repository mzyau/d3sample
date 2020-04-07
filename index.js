const { getIntrospectionQuery } = require('graphql');
const { buildClientSchema } = require ('graphql');
const { printSchema } = require ('graphql');
const graphURL = "https://worldcup-graphql.now.sh/";



// fetch(graphURL, {
//   method: "Post",
//   headers: {
//     'Content-Type': 'application/json'
//   },
//   body: JSON.stringify({query: getIntrospectionQuery}),
// })
//   .then(res => res.json())
//   .then(data => console.log(data));

// console.log(getIntrospectionQuery());
