// Genesys Cloud Division Information API Sample
// Gets user token using clientId and clientSecret, then retrieves division information

const fetch = require('node-fetch');
const platformClient = require('purecloud-platform-client-v2');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const clientId = process.env.GENESYS_CLOUD_CLIENT_ID;
const clientSecret = process.env.GENESYS_CLOUD_CLIENT_SECRET;
const DIVISION = "RUWAZEPZLVUB";
const MESSENGER_CONFIG_ID = "b3732897-7715-4f53-ac26-469cad324256";
const MESSENGER_CONFIG_VERSION = "1";
const userId = "04a98822-f4cc-4822-aa55-e49618f282c6";
console.log('Client ID:', clientId);
console.log('Client Secret:', clientSecret ? '[REDACTED]' : 'Not found');

// Use the same environment as the existing oauth.js file
const environment = platformClient.PureCloudRegionHosts.ca_central_1;
let creds = null;

// Initialize the process
try {
    fs.readFile("auth.json", "utf8", (err, jsonString) => {
        if (err) {
            console.log("Error reading auth file from disk:", err);
            fetchToken();
        } else {
            try {
                creds = JSON.parse(jsonString);
                console.log(`Using cached token: ${creds.access_token.substring(0, 20)}...`);
                getDivisionInformation();
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

// Save token to file for reuse
function saveToken(body) {
    fs.writeFile('auth.json', JSON.stringify(body), (err) => {
        if (err) throw err;
        console.log('Token saved to auth.json');
    });
}

// Fetch OAuth token using client credentials
function fetchToken() {
    console.log('Fetching new OAuth token...');
    
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
    
    console.log('Token Request URL:', url);
    
    fetch(url, options)
    .then(res => {
        if(res.ok){
            return res.json();
        } else {
            throw Error(`HTTP ${res.status}: ${res.statusText}`);
        }
    })
    .then(jsonResponse => {
        console.log(`Authentication successful. Token acquired.`);
        creds = jsonResponse;
        saveToken(jsonResponse);
        getDivisionInformation();
    })
    .catch(e => console.error('Token fetch error:', e));
}

// Get current user information
function getCurrentUser() {
    console.log('Getting current user information...');
    
    const url = `https://api.${environment}/api/v2/users/me`;
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${creds.token_type} ${creds.access_token}`
        }
    };

    console.log("current user", url, options);
    
    console.log('Current User Request URL:', url);
    
    return fetch(url, options)
    .then(res => {
        if(res.ok){
            return res.json();
        } else if (res.status === 401) {
            console.log('Token expired, fetching new token...');
            fetchToken();
            throw Error('Token expired');
        } else {
            throw Error(`HTTP ${res.status}: ${res.statusText}`);
        }
    })
    .then(userInfo => {
        console.log('Current User Information:');
        console.log(`- Name: ${userInfo.name}`);
        console.log(`- Email: ${userInfo.email}`);
        console.log(`- User ID: ${userInfo.id}`);
        if (userInfo.division) {
            console.log(`- User's Division: ${userInfo.division.name} (ID: ${userInfo.division.id})`);
        }
        return userInfo;
    })
    .catch(e => {
        if (e.message !== 'Token expired') {
            console.error('❌ Error getting current user:', e);
        }
        throw e;
    });
}

// Get specific division by name
function getSpecificDivision() {
    const targetDivisionName = "Hackathon " + DIVISION;
    console.log(`Looking for division: "${targetDivisionName}"`);
    
    const url = `https://api.${environment}/api/v2/authorization/divisions`;
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${creds.token_type} ${creds.access_token}`
        }
    };
    
    console.log('Divisions Request URL:', url);
    
    return fetch(url, options)
    .then(res => {
        if(res.ok){
            return res.json();
        } else if (res.status === 401) {
            console.log('Token expired, fetching new token...');
            fetchToken();
            throw Error('Token expired');
        } else {
            throw Error(`HTTP ${res.status}: ${res.statusText}`);
        }
    })
    .then(divisionsResponse => {
        if (divisionsResponse.entities && divisionsResponse.entities.length > 0) {
            // Find the specific division
            const targetDivision = divisionsResponse.entities.find(division => 
                division.name === targetDivisionName
            );
            
            if (targetDivision) {
                console.log(`\nFound Division: "${targetDivisionName}"`);
                console.log('Division Details:');
                console.log(`- Name: ${targetDivision.name}`);
                console.log(`- ID: ${targetDivision.id}`);
                console.log(`- Description: ${targetDivision.description || 'No description'}`);
                console.log(`- Home Division: ${targetDivision.homeDivision ? 'Yes' : 'No'}`);
                if (targetDivision.state) {
                    console.log(`- State: ${targetDivision.state}`);
                }
                if (targetDivision.version) {
                    console.log(`- Version: ${targetDivision.version}`);
                }
                if (targetDivision.dateCreated) {
                    console.log(`- Created: ${new Date(targetDivision.dateCreated).toLocaleString()}`);
                }
                if (targetDivision.dateModified) {
                    console.log(`- Modified: ${new Date(targetDivision.dateModified).toLocaleString()}`);
                }
                console.log('');
                return targetDivision;
            } else {
                console.log(`\nDivision "${targetDivisionName}" not found.`);
                console.log('Available divisions:');
                divisionsResponse.entities.forEach((division, index) => {
                    console.log(`${index + 1}. ${division.name}`);
                });
                return null;
            }
        } else {
            console.log('No divisions found in the organization.');
            return null;
        }
    })
    .catch(e => {
        if (e.message !== 'Token expired') {
            console.error('Error getting divisions:', e);
        }
    });
}

// Get existing queue by name if it already exists
function getExistingQueue() {
    const queueName = "Queue" + DIVISION;
    console.log(`\nLooking for existing queue: "${queueName}"`);
    
    const url = `https://api.${environment}/api/v2/routing/queues?name=${encodeURIComponent(queueName)}`;
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${creds.token_type} ${creds.access_token}`
        }
    };
    
    console.log('Get Queue Request URL:', url);
    
    return fetch(url, options)
    .then(res => {
        if(res.ok){
            return res.json();
        } else if (res.status === 401) {
            console.log('Token expired, fetching new token...');
            fetchToken();
            throw Error('Token expired');
        } else {
            throw Error(`HTTP ${res.status}: ${res.statusText}`);
        }
    })
    .then(queueResponse => {
        if (queueResponse.entities && queueResponse.entities.length > 0) {
            const queue = queueResponse.entities[0];
            console.log(`✅ Found existing queue: "${queue.name}" (ID: ${queue.id})`);
            return queue;
        } else {
            console.log(`ℹ️  Queue "${queueName}" not found.`);
            return null;
        }
    })
    .catch(e => {
        if (e.message !== 'Token expired') {
            console.error('❌ Error getting queue:', e.message);
        }
        throw e;
    });
}

// Create a new queue using the division information
function createQueue(divisionInfo) {
    const queueName = "Queue" + DIVISION;
    console.log(`\nCreating queue: "${queueName}"`);
    
    const url = `https://api.${environment}/api/v2/routing/queues`;
    
    const queueBody = {
        name: queueName,
        description: `Queue created for division ${divisionInfo.name}`,
        division: {
            id: divisionInfo.id,
            name: divisionInfo.name
        }
    };
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${creds.token_type} ${creds.access_token}`
        },
        body: JSON.stringify(queueBody)
    };
    
    console.log('Create Queue Request URL:', url);
    console.log('Queue Body:', JSON.stringify(queueBody, null, 2));
    
    return fetch(url, options)
    .then(res => {
        if(res.ok){
            return res.json();
        } else if (res.status === 401) {
            console.log('Token expired, fetching new token...');
            fetchToken();
            throw Error('Token expired');
        } else if (res.status === 409) {
            throw Error('Queue with this name already exists');
        } else if (res.status === 400) {
            return res.json().then(errorBody => {
                throw Error(`Bad Request: ${JSON.stringify(errorBody)}`);
            });
        } else {
            return res.json().then(errorBody => {
                throw Error(`HTTP ${res.status}: ${JSON.stringify(errorBody)}`);
            }).catch(() => {
                throw Error(`HTTP ${res.status}: ${res.statusText}`);
            });
        }
    })
    .then(queueResponse => {
        console.log('\n✅ Queue Created Successfully!');
        console.log('New Queue Details:');
        console.log(`- Name: ${queueResponse.name}`);
        console.log(`- ID: ${queueResponse.id}`);
        console.log(`- Division: ${queueResponse.division.name} (${queueResponse.division.id})`);
        if (queueResponse.dateCreated) {
            console.log(`- Created: ${new Date(queueResponse.dateCreated).toLocaleString()}`);
        }
        console.log('');
        return queueResponse;
    })
    .catch(e => {
        if (e.message !== 'Token expired') {
            console.error('❌ Error creating queue:', e.message);
            if (e.message.includes('Queue with this name already exists')) {
                console.log(`ℹ️  Queue "${queueName}" already exists in the system.`);
            }
        }
        throw e;
    });
}

// Add user to queue using the queue ID and user ID
function addUserToQueue(queueId, userId) {
    console.log(`\nAdding user ${userId} to queue ${queueId}...`);
    
    const url = `https://api.${environment}/api/v2/routing/queues/${queueId}/members`;
    
    const requestBody = [
        {
            id: userId
        }
    ];
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${creds.token_type} ${creds.access_token}`
        },
        body: JSON.stringify(requestBody)
    };
    
    console.log('Add User to Queue Request URL:', url);
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    
    return fetch(url, options)
    .then(res => {
        if(res.ok){
            console.log('\n✅ User Added to Queue Successfully!');
            return res.statusText;
        } else if (res.status === 401) {
            console.log('Token expired, fetching new token...');
            fetchToken();
            throw Error('Token expired');
        } else if (res.status === 400) {
            return res.json().then(errorBody => {
                throw Error(`Bad Request: ${JSON.stringify(errorBody)}`);
            });
        } else if (res.status === 404) {
            throw Error('Queue or user not found');
        } else {
            return res.json().then(errorBody => {
                throw Error(`HTTP ${res.status}: ${JSON.stringify(errorBody)}`);
            }).catch(() => {
                throw Error(`HTTP ${res.status}: ${res.statusText}`);
            });
        }
    })
    .catch(e => {
        if (e.message !== 'Token expired') {
            console.error('❌ Error adding user to queue:', e.message);
        }
        throw e;
    });
}

// Get or create an Architect flow for the messenger deployment
async function getOrCreateFlow(divisionInfo) {
    const flowName = "Flow" + DIVISION;
    console.log(`\nLooking for flow: "${flowName}"`);
    
    // First, try to get existing flow
    const getUrl = `https://api.${environment}/api/v2/flows?name=${encodeURIComponent(flowName)}&type=inboundshortmessage`;
    const getOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${creds.token_type} ${creds.access_token}`
        }
    };
    
    try {
        const response = await fetch(getUrl, getOptions);
        if (response.ok) {
            const flowsResponse = await response.json();
            if (flowsResponse.entities && flowsResponse.entities.length > 0) {
                const existingFlow = flowsResponse.entities.find(flow => flow.name === flowName);
                if (existingFlow) {
                    console.log(`✅ Found existing flow: "${flowName}" (ID: ${existingFlow.id})`);
                    return existingFlow;
                }
            }
        }
    } catch (error) {
        console.log('⚠️  Error checking for existing flow, will try to create new one.');
    }
}

// Create messenger deployment
async function createMessengerDeployment(divisionInfo) {
    console.log(`\nCreating messenger deployment for division: ${divisionInfo.name}`);
    
    try {
        // Get or create the flow
        const flow = await getOrCreateFlow(divisionInfo);
        
        // Create the deployment
        const deploymentName = "Dep" + DIVISION;
        console.log(`\nCreating messenger deployment: "${deploymentName}"`);
        
        const url = `https://api.${environment}/api/v2/webdeployments/deployments`;
        const deploymentBody = {
            name: deploymentName,
            description: `Messenger deployment for division ${divisionInfo.name}`,
            allowAllDomains: true,
            configuration: {
                id: MESSENGER_CONFIG_ID,
                version: MESSENGER_CONFIG_VERSION || "1"
            },
            flow: {
                id: flow.id
            }
        };
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${creds.token_type} ${creds.access_token}`
            },
            body: JSON.stringify(deploymentBody)
        };
        
        console.log('Creating deployment with URL:', url);
        console.log('Deployment Body:', JSON.stringify(deploymentBody, null, 2));
        
        const response = await fetch(url, options);
        if (response.ok) {
            const deployment = await response.json();
            console.log('\n✅ Messenger Deployment Created Successfully!');
            console.log('Deployment Details:');
            console.log(`- Name: ${deployment.name}`);
            console.log(`- ID: ${deployment.id}`);
            console.log(`- Allow All Domains: ${deployment.allowAllDomains}`);
            console.log(`- Configuration ID: ${deployment.configuration.id}`);
            console.log(`- Flow ID: ${deployment.flow.id}`);
            if (deployment.dateCreated) {
                console.log(`- Created: ${new Date(deployment.dateCreated).toLocaleString()}`);
            }
            return deployment;
        } else {
            const errorText = await response.text();
            throw new Error(`Failed to create messenger deployment: ${response.status} - ${errorText}`);
        }
        
    } catch (error) {
        console.error('❌ Error in createMessengerDeployment:', error.message);
        throw error;
    }
}

// Main function to get division information, create queue, and add user
async function getDivisionInformation() {
    console.log('\n=== Getting Division Information, Creating Queue & Adding User ===\n');
    
    try {
        // Get current user info first
        // const currentUser = await getCurrentUser();
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Then get the specific division
        const targetDivision = await getSpecificDivision();
        
        if (targetDivision) {
            console.log('✅ Division information retrieved successfully.');
            
            console.log('\n' + '='.repeat(50) + '\n');
            
            let queue = null;
            
            // Try to get existing queue first
            try {
                queue = await getExistingQueue();
            } catch (getQueueError) {
                if (getQueueError.message !== 'Token expired') {
                    console.log('⚠️  Error checking for existing queue, will try to create new one.');
                }
            }
            
            // If queue doesn't exist, create it
            if (!queue) {
                try {
                    queue = await createQueue(targetDivision);
                } catch (queueError) {
                    if (queueError.message !== 'Token expired') {
                        console.log('⚠️  Division found but queue creation failed.');
                        console.log('This might be due to permissions or the queue already existing.');
                        
                        // Try to get the existing queue one more time
                        try {
                            queue = await getExistingQueue();
                        } catch (retryError) {
                            console.log('❌ Could not retrieve or create queue.');
                        }
                    }
                }
            }
            
            // If we have a queue (either existing or newly created), add the user
            if (queue && queue.id) {
                console.log('\n' + '='.repeat(50) + '\n');
                
                try {
                    await addUserToQueue(queue.id, userId);
                    console.log(`✅ User ${userId} has been added to queue "${queue.name}" (${queue.id})`);
                    
                    // Create messenger deployment after user is added to queue
                    console.log('\n' + '='.repeat(50) + '\n');
                    console.log('🚀 Creating messenger deployment...');
                    
                    try {
                        await createMessengerDeployment(targetDivision);
                        console.log('\n🎉 Complete process finished successfully!');
                        console.log('✅ User added to queue and messenger deployment created!');
                    } catch (deploymentError) {
                        if (deploymentError.message !== 'Token expired') {
                            console.error('❌ Error creating messenger deployment:', deploymentError.message);
                            console.log('⚠️  User was added to queue successfully, but messenger deployment failed.');
                        }
                    }
                } catch (addUserError) {
                    if (addUserError.message !== 'Token expired') {
                        console.error('❌ Error adding user to queue:', addUserError.message);
                        console.log('This might be due to:');
                        console.log('- Invalid user ID');
                        console.log('- User already in the queue');
                        console.log('- Insufficient permissions');
                    }
                }
            } else {
                console.log('❌ Cannot add user to queue - no queue available.');
            }
        } else {
            console.log('❌ Cannot proceed - target division not found.');
        }
        
    } catch (error) {
        console.error('❌ Error in getDivisionInformation:', error);
    }
}
