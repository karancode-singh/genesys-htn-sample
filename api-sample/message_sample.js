// Message sending sample for Genesys Cloud
// Based on survey_sample.js authentication pattern

const fetch = require('node-fetch');
const platformClient = require('purecloud-platform-client-v2');
const dotenv = require('dotenv');
const fs = require('fs');
const readline = require('readline');

dotenv.config();

const clientId = process.env.GENESYS_CLOUD_CLIENT_ID;
const clientSecret = process.env.GENESYS_CLOUD_CLIENT_SECRET;
const environment = platformClient.PureCloudRegionHosts.ca_central_1;
let creds = null;

// Initialize readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt user for input
function promptUser(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Start the application
try {
    fs.readFile("auth.json", "utf8", (err, jsonString) => {
        if (err) {
            console.log("Error reading auth file from disk:", err);
            fetchToken();
        } else {
            try {
                creds = JSON.parse(jsonString);
                console.log(`Using existing token: ${creds.access_token.substring(0, 20)}...`);
                startMessageSession();
            } catch (err) {
                console.log("Error parsing JSON string:", err);
                fetchToken();
            }
        }
    });
} catch(e) {
    console.log("Unexpected error reading auth file from disk:", e);
    fetchToken();
}

function saveToken(body) {
    fs.writeFile('auth.json', JSON.stringify(body), (err) => {
        if (err) throw err;
        console.log('Token saved');
    });
}

function fetchToken() {
    console.log('Fetching new authentication token...');
    
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
    
    fetch(url, options)
    .then(res => {
        if(res.ok){
            return res.json();
        } else {
            throw Error(res.statusText);
        }
    })
    .then(jsonResponse => {
        console.log(`Authenticated successfully.`);
        creds = jsonResponse;
        saveToken(jsonResponse);
        startMessageSession();
    })
    .catch(e => console.error('Authentication error:', e));
}

async function startMessageSession() {
    try {
        console.log('\n=== Genesys Cloud Message Sender ===');
        
        // Get conversationId and communicationId from user
        const conversationId = await promptUser('Enter conversationId: ');
        const communicationId = await promptUser('Enter communicationId: ');
        
        // Close the initial readline interface
        rl.close();
        
        console.log('\nEnter messages to send (press Ctrl+D when finished):');
        
        // Set up message input loop with a fresh readline interface
        const messageRl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> '
        });
        
        messageRl.prompt();
        
        messageRl.on('line', async (message) => {
            if (message.trim()) {
                await sendMessage(conversationId, communicationId, message.trim());
            }
            messageRl.prompt();
        });
        
        messageRl.on('close', () => {
            console.log('\nEnd and wrap-up the interaction from the UI');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Error in message session:', error);
        if (rl) rl.close();
        process.exit(1);
    }
}

async function sendMessage(conversationId, communicationId, messageText) {
    const url = `https://api.${environment}/api/v2/conversations/messages/${conversationId}/communications/${communicationId}/messages`;
    
    const messageBody = {
        textBody: messageText,
        messageType: 'Text'
    };
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${creds.token_type} ${creds.access_token}`
        },
        body: JSON.stringify(messageBody)
    };
    
    try {
        console.log(`Sending message: "${messageText}"`);
        
        const response = await fetch(url, options);
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✓ Message sent successfully (ID: ${result.id})`);
        } else if (response.status === 401) {
            console.log('Token expired, fetching new token...');
            await new Promise((resolve) => {
                fetchToken();
                // Wait a bit for token refresh
                setTimeout(resolve, 2000);
            });
            // Retry sending the message
            await sendMessage(conversationId, communicationId, messageText);
        } else {
            const errorText = await response.text();
            console.error(`✗ Failed to send message (${response.status}): ${errorText}`);
        }
    } catch (error) {
        console.error('✗ Error sending message:', error.message);
    }
}
