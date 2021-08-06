const { query } = require('express');
const got = require('got');
const {map_umm_keys_to_schema, trim} = require('./helpers')
let CMR_ENV = process.env.CMR_ENV || '';
if (['uat', 'sit'].includes(CMR_ENV.toLowerCase())){
  CMR_ENV = `${process.env.CMR_ENV}.`

}


const cmrEndpoint = `https://cmr.${CMR_ENV}earthdata.nasa.gov/search`;




async function searchCmrCollections(concept_id, short_name, page_size) {
  const conceptIdQuery = concept_id ? `concept_id=${concept_id}` : "";
  const shortNameQuery = short_name ? `short_name=${short_name}` : "";
  const query = trim(`${conceptIdQuery}&${shortNameQuery}`, '&')
  page_size = page_size ? page_size:1
  const response = await got(cmrEndpoint + `/collections.umm_json?page_size=${page_size}&${query}&include_granule_counts=true`);
  if (JSON.parse(response.body).items.length == 0) {
    return new Error(`No collection was found with ${query}`);

  }

    let {meta, umm} = JSON.parse(response.body).items[0]
    let collection_meta = map_umm_keys_to_schema(meta)
    if (umm['CollectionCitations']){
      umm['CollectionCitations'] = umm['CollectionCitations'][0]['OtherCitationDetails']

    }
    const range_date = umm['TemporalExtents'][0]['RangeDateTimes'][0]
    umm['ProcessingLevel'] = umm['ProcessingLevel'].Id
    umm['BeginningDateTime'] = range_date['BeginningDateTime']
    umm['EndingDateTime'] = range_date['EndingDateTime']
    const bbox = umm['SpatialExtent']['HorizontalSpatialDomain']['Geometry']['BoundingRectangles'][0]
    umm['BoundingRectangles'] =  JSON.stringify(bbox)
    umm['DataDates'].forEach(data_dates => {
      element = "CREATE" === data_dates['Type'] ? 'CreatedAt': 'UpdatedAt'
      umm[element] = data_dates['Date']

    });


  //return_result[0]['platforms'] = [{'short_name': 'baco'}]
  return Object.assign({}, collection_meta, umm);
}

async function searchCmrGranules(parent, concept_id, provider, short_name, page_size, offset) {
 let defautl_page_size = 4
 if(parent) {
  concept_id = parent.concept_id
  short_name = parent.short_name
  // Making default page size to be 1 if the granules are nested
  // in a collection query
  defautl_page_size = 1

  }
  page_size = page_size ? page_size:defautl_page_size
  offset = offset ? offset :0

  const conceptIdQuery = concept_id ? `collection_concept_id=${concept_id}` : "";
  const shortNameQuery = short_name ? `short_name=${short_name}` : "";
  const providerQuery = provider ? `provider=${provider}`: "";
  const query = trim(`${conceptIdQuery}&${shortNameQuery}&${providerQuery}`, '&')
  const response = await got(`${cmrEndpoint}/granules.json?page_size=${page_size}&${query}&offset=${offset}`);
  let granule_entry = JSON.parse(response.body).feed.entry
  granule_entry.forEach(granule => {
    granule['name'] = granule['title']

  });

  return granule_entry ;
}

async function searchCmrUMMVars(concept_id, name) {
  const conceptIdQuery = concept_id ? `concept_id=${concept_id}` : "";
  const nameQuery = name ? `name=${name}` : "";
  const query = trim(`${conceptIdQuery}&${nameQuery}`, '&')
  const response = await got(`${cmrEndpoint}/variables.json?page_size=4&${query}`);
  return JSON.parse(response.body).items;

}

async function searchCmrVariables(collection) {
  const associations = collection.associations;
  if (associations != undefined) {
    const variableConceptIds = associations.variables;
    if (variableConceptIds != undefined) {
      const queryStr = (variableConceptIds.length > 0) ? "concept_id=" + variableConceptIds.join("&concept_id=") : "";
      const response = await got(`${cmrEndpoint}/variables.json?page_size=4&${queryStr}`);
      return JSON.parse(response.body).items;
    }
  }
  return null;
}

async function searchCmrServices(collection) {
  const associations = collection.associations;
  if (associations != undefined) {
    const serviceConceptIds = associations.services;
    if (serviceConceptIds != undefined) {
      const queryStr = (serviceConceptIds.length > 0) ? "concept_id=" + serviceConceptIds.join("&concept_id=") : "";
      const response = await got(`${cmrEndpoint}/services.umm_json?page_size=4&${queryStr}`);
      associated_services = []
      JSON.parse(response.body).items.forEach(service => {
      let service_meta = map_umm_keys_to_schema(service['meta'])

        associated_services.push(Object.assign({}, service_meta, service['umm']))

      });

      return associated_services;
    }
  }
  return null;
}

function isBrowseLink(link) {
  return link.rel === "http://esipfed.org/ns/fedsearch/1.1/browse#";
}

function isDownloadLink(link) {
  return link.rel === "http://esipfed.org/ns/fedsearch/1.1/data#" && link.inherited != true;
}

function getBrowseLink(concept) {
  const links = concept.links.filter(isBrowseLink);
  if (links.length > 0) {
    return links[0].href;
  }
  return null;
}

function getDownloadLink(concept) {
  const links = concept.links.filter(isDownloadLink);
  if (links.length > 0) {
    return links[0].href;
  }
  return null;
}

module.exports = {searchCmrCollections, searchCmrUMMVars, searchCmrGranules, searchCmrVariables, searchCmrServices, getBrowseLink, getDownloadLink};
