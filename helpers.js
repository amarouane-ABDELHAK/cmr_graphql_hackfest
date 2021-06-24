
// UMM returns keys with hiphen but graphQL doesn't support 
// A hiphen in a dictionary
const  map_umm_keys_to_schema = (obj)  => {
    const keyValues = Object.keys(obj).map(key => {
      const newKey = key.replace(/(-)/g, '_');
      return { [newKey]: obj[key] };
    });
    return Object.assign({}, ...keyValues);
  }


const trim = (str, chars) => str.split(chars).filter(Boolean).join(chars);

module.exports = {map_umm_keys_to_schema, trim}