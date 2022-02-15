/**
 * The goal of this script :
 * Verify that all the information in the config are good
 * is something is wrong the programme will crash
 */

 const objects = {
    "port": check_positive_number,
    
    "MICROSOFT.REDIRECT_URL": check_basic_string,
    "MICROSOFT.AZURE_CLIENT_ID": check_basic_string,
    "MICROSOFT.AZURE_TENANT_ID": check_basic_string,
    "MICROSOFT.AZURE_CLIENT_SECRET": check_basic_string,

    "CRI.CSRF_TOKEN": check_basic_string,
    "CRI.AUTHORIZATION": check_basic_string,

    "SSL.privkey": check_basic_string,
    "SSL.fullchain": check_basic_string,

    "SESSIONS.LIFETIME": check_positive_number,
    "SESSIONS.SECRET": check_basic_string,
}


/**
 * Check all the config with the "objects" informations
 */
function check_config()
{
    const config = require("./config.json");

    const keys = Object.keys(objects); // get all keys of "objects"
    keys.forEach(key => {
            const elt = get_json_element(config, key);
            if (typeof elt == "undefined")
            {
            throw new Error(`config error: ${key} is missing`);
            }
            objects[key](key, elt);
            });
}

function get_json_element(json, path)
{
    const paths = path.split(".");
    var obj = json;
    paths.forEach(path => {
            obj = obj[path];
            if (typeof obj == "undefined")
            return undefined;
            });
    return obj;
}

/**
 * Check the positive number
 */
function check_positive_number(key, elt)
{
    if (typeof elt !== "number" || elt < 0)
    {
        throw new Error(`config error: ${key} is incorrect`);
    }
}

/**
 * Check the basic string
 */
function check_basic_string(key, elt)
{
    if (typeof elt !== "string" || elt === "")
    {
        throw new Error(`config error: ${key} is incorrect`);
    }
}

module.exports = check_config;
