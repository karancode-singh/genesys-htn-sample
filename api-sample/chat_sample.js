const fetch = require('node-fetch');
const WebSocket = require('ws');
const environment = 'cac1.pure.cloud'; // Canada region
const orgId = '07d7213b-8d0e-4984-b806-5f416483b7d3'; // Organization Id for genesys6
const deploymentId = 'c843036b-d7d8-451a-9087-557ee9820f74'; // Deployment Id - associated with the web chat location - same as deploymentKey on https://developer.dev-genesys.cloud/developer-tools/#/webchat
const queueName = 'MontiTestQueue'; // The name of the queue
const displayName = 'Yu Xuan Customer'; // The display name for the guest chat conversation
const email = 'karanjot.singh@genesys.com' // The associated email address for the guest
const routingTarget = {"targetAddress":queueName,"targetType":"QUEUE","priority":2};
const memberInfo = {"displayName":displayName,"role":"CUSTOMER","customFields":{"firstName":"Yu Xuan Customer","lastName":"","addressStreet":"","addressCity":"","addressPostalCode":"","addressState":"","phoneNumber":"","customField1Label":"","customField1":"","customField2Label":"","customField2":"","customField3Label":"","customField3":"","_genesys_source":"web","_genesys_referrer":"","_genesys_url":"https://developer.dev-genesys.cloud/developer-tools/#/webchat","_genesys_pageTitle":"Developer Tools","_genesys_browser":"Chrome","_genesys_OS":"Mac OS X","email":email,"subject":""}}

function startGuestChat(body) {
    console.log('start guest chat');
    return fetch(`https://api.${environment}/api/v2/webchat/guest/conversations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            organizationId: orgId,
            deploymentId: deploymentId,
            routingTarget: routingTarget,
            memberInfo: memberInfo
        })
    })
    .then(res => {
        if(res.ok){
            return res.json();
        } else {
            throw Error(res.statusText);
        }
    })
    .catch(e => console.error(e));
}

function sendGuestChat(jwt, conversationId, messageId, text) {
    console.log('send guest chat');
    console.log(arguments);
    return fetch(`https://api.${environment}/api/v2/webchat/guest/conversations/${conversationId}/members/${messageId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
            body: text,
        })
    })
    .then(res => {
        if(res.ok){
            return res.json();
        } else {
            throw Error(res.statusText);
        }
    })
    .catch(e => console.error(e));
}

function connectWebSocket(eventStreamUri) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(eventStreamUri);
        ws.on('open', () => {
            console.log(`Connected to ${eventStreamUri}`);
            resolve()
        });
        ws.on('message', (data) => { // Process the messages here
            console.log(`Received message: ${data}`);
        });
    })
}

// Send guest messages
startGuestChat().then((res) => 
    connectWebSocket(res["eventStreamUri"]).then(async () => {
        const conversationId = res["id"];
        const messageId = res["member"]["id"];
        const jwt = res["jwt"]
        await sendGuestChat(jwt, conversationId, messageId, "Hello!"); // Send messages here
        await sendGuestChat(jwt, conversationId, messageId, "I have some questions regarding my most recent bill.");
    })
);
