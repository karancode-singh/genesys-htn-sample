Sample code for using Genesys API for the hack the north event

Pre-requisite
--------------
* Install node.js on your system, if not installed already
* Run `npm install` at the root directory where the package.json resides. Remove `package-lock.json` and try again if facing errors
* Update GENESYS_CLOUD_CLIENT_ID, GENESYS_CLOUD_CLIENT_SECRET and DIVISION environment variables with the oauth credentials and division code that is provided to you.

Running the program
-------------------
* Run `npm run start:survey` for creating a publishing a survey form.
* Run `npm run start:message` for sending messages on an ongoing message interaction
* Run `npm run start:chat` for the web chat demo. (note that chat has been deprecated)

Setting up messenger configuration
----------------------------------
* Run `npm run start:config_message` to begin setting up messenger configuration
* Create a new "Inbound Message" flow in Architect named "Flow<DIVISION>". Set it up to transfer to ACD on the queue that was created by the script. Publish it.
* Press return key to continue setup

Messenger testing tool
----------------------
* open https://developer.genesys.cloud/devapps/web-messenger
* select deployment
* start chat
Note: you need to be on queue to chat as an agent from Genesys Cloud UI

Troubleshooting
---------------
* If facing 4xx errors with API calls, login in to your Genesys Cloud account, issue `localStorage.getItem("pc_auth")` command in the console of dev tools of the browser, copy over `access_token` into auth.json file, and try again. If still facing issues, you might lack permissions to perform the action and can reach out to us.
