const { ApolloServer } = require('apollo-server-lambda');
const { typeDefs, resolvers } = require('./graphql.js');

const server = new ApolloServer({ typeDefs, resolvers });

//exports.lambdaHandler = server.createHandler();

