const axios = require('axios').default;

const config = require("../../config.json");

const Error = require("./entities/Error");

module.exports.oauth_url = `https://login.microsoftonline.com/${config.MICROSOFT.AZURE_TENANT_ID}/oauth2/authorize?client_id=${config.MICROSOFT.AZURE_CLIENT_ID}&response_type=code&redirect_uri=${config.MICROSOFT.REDIRECT_URL}`;

/**
 * Permet de recuperer un access_token microsoft a partir du code oauth
 * @param {*} code microsoft code
 * @param {*} callback 
 */
module.exports.get_access_token = (code) => {
    return new Promise((resolve, reject) => {
        let url = `https://login.microsoftonline.com/${config.MICROSOFT.AZURE_TENANT_ID}/oauth2/token`;
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', config.MICROSOFT.AZURE_CLIENT_ID);
        params.append('code', code);
        params.append('redirect_uri', config.MICROSOFT.REDIRECT_URL)
        params.append('client_secret', config.MICROSOFT.AZURE_CLIENT_SECRET)
        params.append('resource', 'https://graph.microsoft.com')
        const opt = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        axios.post(url, params, opt).then(result => {
            const data = result.data;
            const access_token = data.access_token;
            resolve(access_token);
        }).catch(err => {
            reject(Error.get_axios(err));
        });
    });
}

/**
 * Permet de recuperer les info microsoft ave un access_token microsoft
 * @param {*} microsoft_token access_token microsoft
 * @param {*} callback 
 */
module.exports.get_userinfo = (microsoft_token) => {
    return new Promise((resolve, reject) => {
        const url = 'https://graph.microsoft.com/v1.0/me'
        const options = {
            headers: {
                'Authorization': `Bearer ${microsoft_token}`
            }
        }
        axios.get(url, options).then(result => {
            resolve(result.data)
        }).catch(err => {
            reject(Error.get_axios(err));
        })
    });
};
