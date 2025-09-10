// https://developer.genesys.cloud/authorization/platform-auth/guides/oauth-client-credentials-guide

const fetch = require('node-fetch');
const platformClient = require('purecloud-platform-client-v2');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const clientId = process.env.GENESYS_CLOUD_CLIENT_ID;
const clientSecret = process.env.GENESYS_CLOUD_CLIENT_SECRET;
console.log(clientId);
console.log(clientSecret);
// const environment = process.env.GENESYS_CLOUD_ENVIRONMENT; // expected format: mypurecloud.com
const environment = platformClient.PureCloudRegionHosts.ca_central_1
let creds = null;

try {
    fs.readFile("auth.json", "utf8", (err, jsonString) => {
        if (err) {
            console.log("Error reading auth file from disk:", err);
            fetchToken();
        } else {
            try {
                creds = JSON.parse(jsonString);
                console.log(`creds read: ${creds.access_token}`);
                createSurvey();
            } catch (err) {
                console.log("Error parsing JSON string:", err);
            }
        }
    });
} catch(e) {
    console.log("Unexpected error reading auth file from disk:", err);
    fetchToken();
}


// Test token by getting role definitions in the organization.
function handleTokenCallback(body){
    const url = `https://api.${environment}/api/v2/authorization/roles`;
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${body.token_type} ${body.access_token}`
        }
    };
    console.log('Fetch Request for role:', { url, ...options });
    return fetch(url, options)
    .then(res => {
        if(res.ok){
            return res.json();
        } else {
            throw Error(res.statusText);
        }
    })
    .then(jsonResponse => {
        console.log(jsonResponse);
    })
    .catch(e => console.error(e));
}

function saveToken(body) {
    fs.writeFile('auth.json', JSON.stringify(body), (err) => {
        if (err) throw err;
        console.log('token saved');
    });
}

function fetchToken() {
    // Genesys Cloud Authentication
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');

    const url = `https://login.${environment}/oauth/token`;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(clientId + ':' + clientSecret).toString('base64')}`
        },
        body: params
    };
    console.log('Fetch Token Request:', { url, ...options });
    fetch(url, options)

    .then(res => {
        if(res.ok){
            return res.json();
        } else {
            throw Error(res.statusText);
        }
    })
    .then(jsonResponse => {
        console.log(`Authenticated successfully. Response:\n${jsonResponse.access_token}`);
        creds = jsonResponse;
        saveToken(jsonResponse);
        createSurvey();
    })
    .catch(e => console.error(e));
}

function publishSurvey(body) {
    console.log('publishing survey');
    const url = `https://api.${environment}/api/v2/quality/publishedforms/surveys`;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${creds.token_type} ${creds.access_token}`
        },
        body: JSON.stringify({"id": body.id})
    };
    console.log('Fetch Request (publish survey):', { url, ...options });
    fetch(url, options)
    .then(res => {
        if(res.ok){
            return res.json();
        } else {
            throw Error(res.statusText);
        }
    })
    .then(jsonResponse => {
        console.log(jsonResponse);
    })
    .catch(e => console.error(e));
}

function createSurvey() {
    console.log('creating survey');
    const url = `https://api.${environment}/api/v2/quality/forms/surveys`;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${creds.token_type} ${creds.access_token}`
        },
        body: JSON.stringify({"name":"Test Survey demo","language":"en-US","questionGroups":[{"id":"5ef87c2b-074c-4eb2-998a-c3f5e63b4a97","name":"Tell me about yourself","type":"questionGroup","questions":[{"id":"c4a835a2-e151-4e0b-9d79-169ce435e1ca","text":"What is your name","helpText":"","type":"freeTextQuestion","naEnabled":false,"answerOptions":[],"maxResponseCharacters":250}]}]})
    };
    console.log('Fetch Request (createSurvey):', { url, ...options });
    fetch(url, options)
    .then(res => {
        if(res.ok){
            return res.json();
        } else if (res.status == 401) {
            fetchToken();
            throw Error(res.statusText);
        } else {
            console.log(res.headers);
            throw Error(res.statusText);
        }
    })
    .then(jsonResponse => {
        console.log(jsonResponse);
        publishSurvey(jsonResponse);
    })
    .catch(e => console.error(e));
}
