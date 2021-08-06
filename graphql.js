const {makeExecutableSchema} = require('graphql-tools');
const {searchCmrCollections, searchCmrUMMVars, searchCmrGranules, searchCmrVariables, searchCmrServices, getBrowseLink, getDownloadLink} = require('./cmr.js');

// Construct a schema, using GraphQL schema language
// TODO - figure out associations, orbit_parameters, links (would be good to add top level browseLink and downloadLink fields)
const typeDefs = `
  type Granule {
    id: ID!
    time_start: String
    online_access_flag: Boolean
    points: [String]
    day_night_flag: String
    browse_flag: Boolean
    time_end: String
    coordinate_system: String
    original_format: String
    collection_concept_id: String
    data_center: String
    links: [String]
    dataset_id: String
    title: String
    name: String
    granule_size: Float
    updated: String
    browse_link: String
    download_link: String
  }

  type ServiceKeywords {
    ServiceCategory: String
    ServiceTopic: String
    ServiceTerm: String
    ServiceSpecificTerm: String
  }

  type Variable {
    concept_id: ID!
    revision_id: Int
    provider_id: String
    native_id: String
    name: String
    long_name: String
  }

  type Service {
    concept_id: ID!
    revision_id: Int
    provider_id: String
    native_id: String
    Name: String
    LongName: String
    Format: String
    Type: String
    Description: String
    Version: String
    ServiceKeywords: [ServiceKeywords]

  }
  type Instrument {
    ShortName: String
    LongName: String
  }

  type Platform {
    Type: String
    ShortName: String
    LongName: String
    Instruments: [Instrument]
  }

  type Collection {
    concept_id: ID!
    revision_id: Int
    deleted: Boolean
    format: String
    provider_id: String
    user_id: String
    has_formats: Boolean
    has_spatial_subsetting: Boolean
    native_id: String
    has_transforms: Boolean
    has_variables: Boolean
    revision_date: String
    granule_count: Int
    has_temporal_subsetting: Boolean
    CollectionCitations: String
    BoundingRectangles: String
    CollectionProgress: String
    ScienceKeywords: String
    ProcessingLevel: String
    ShortName: String
    EntryTitle: String
    AccessConstraints: String
    CreatedAt: String
    UpdatedAt: String
    Abstract: String
    Version: String
    Projects: String
    UseConstraints: String
    TemporalKeywords: [String]
    BeginningDateTime: String
    EndingDateTime: String    
    granules(page_size:Int, offset:Int): [Granule]
    variables: [Variable]
    services: [Service]
    Platforms: [Platform]
    
    
  }

  type Query {
    collection(concept_id: String, short_name: String, page_size: Int): Collection,
    granules(concept_id: String, provider: String, short_name: String, page_size: Int, offset: Int): [Granule],
    variables(concept_id: String, name: String): [Variable]
  }
`;

const resolvers = {
  Query: {
    collection: (parent, { concept_id, short_name }, context, info) => searchCmrCollections(concept_id, short_name),
    granules: (parent, { concept_id, provider, short_name, page_size, offset }, context, info) => searchCmrGranules(parent,concept_id, provider, short_name, page_size, offset),
    variables: (parent, {concept_id, name}, context, info) => searchCmrUMMVars(concept_id, name)
  },
  Collection: {
    granules: (parent, { concept_id, provider, short_name, page_size, offset }, context, info) => searchCmrGranules(parent, concept_id, provider, short_name, page_size, offset),
    variables: (parent, args, context, info) => searchCmrVariables(parent),
    services: (parent, args, context, info) => searchCmrServices(parent)
  },
  Granule: {
    browse_link: (parent, args, context, info) => getBrowseLink(parent),
    download_link: (parent, args, context, info) => getDownloadLink(parent)
  }
};

executableSchema = makeExecutableSchema({
  "typeDefs": [typeDefs],
  "resolvers": resolvers
});

module.exports = {
  executableSchema,
  typeDefs,
  resolvers
};
