Thank you for your interest in Genesys at Hack the North! This project serves to demonstrate how to access and use Genesys' Public API.
If you have any questions or run into any issues, please reach out to us on the Genesys Slack channel, or visit our booth in the sponsor bay.

Pre-requisites
--------------
* Sign up for Genesys credentials [using the Google form](https://docs.google.com/forms/d/e/1FAIpQLSePwX8jftX8SWIP5io7bOiZntXZl2CwYU-U7sTLcK4FKpRjkQ/viewform)
  * Your login and password will be used to access [Genesys Cloud](https://login.cac1.pure.cloud/)
* Install node.js and your code editor of choice (i.e. VS Code) on your system.

Setup
-------------------
* Run the command `npm install` in the terminal at the root directory where the package.json resides. Remove `package-lock.json` and try again if facing errors.
* Update GENESYS_CLOUD_CLIENT_ID, GENESYS_CLOUD_CLIENT_SECRET and DIVISION environment variables with the oauth credentials and division code.
  * These credentials can be found in the e-mail sent to the address provided in the Google form. The division value is the provided shortcode.
  * This can be done by running the command `export VAR_NAME={var_value}` in the terminal, i.e. `export GENESYS_CLOUD_CLIENT_ID=client_id`.

Running Example Code
-------------------
* survey_sample.js contains sample code to create and publish a survey form. To execute the code, run `npm run start:survey` in the terminal.
* message_sample.js contains sample code to send messages in an ongoing message interaction. To execute the code, run `npm run start:message` in the terminal.
  * NOTE: You will need to set up the messenger configuration before you can send messages. Please refer to the section below for more information. 
* chat_sample.js contains sample code to send chat messages. To execute the code, run `npm run start:chat`
  * NOTE: chat was supported at previous Hack the Norths, but has since been deprecated. The sample exists as a reference point, but Messages should be used instead. 

Setting Up Messenger Configuration
----------------------------------
* In order to run message_sample.js and send sample messages, this setup must be completed first.
* To start, run `npm run start:config_message` in the terminal. This will execute the config_message.js file.
  * The script will try to get your user information, division information, and queue information. It will add you to an existing queue if there is one created by your teammates, or will create a queue and assign you to it if none exist.
  * Once added to the queue, you will see a terminal message `Press return key once you have setup flow "{FlowName}" in architect (see readme):` Leave the terminal alone and navigate back to Genesys Cloud.
* In the `Admin` tab, navigate to the `Architect` category and click on `Architect`. This is where conversational flows can be created.
  * Navigate to the `Flows` Tab. Hover over the triple dots icon and ensure `Inbound Message` is selected.
  * Click on the add button to bring up the `Create 'Inbound Message' Flow` modal. Enter the specified `{FlowName}` value into the name field.
    * Your flow must follow this naming format. It should be `Flow{division}`.
  * In the flow editor screen, find the `Search Toolbox` search bar and search for `Transfer to ACD`. Drag and drop this box into the flow so that it is in between the `Start` and `Disconnect` steps.
    * Click on the inserted `Transfer to ACD` step and identify the `Queue` field in the settings sidebar. Select the queue that was created/found in your code editor (it should be named `Queue{shortcode}`).
  * Click on the `Publish` button to publish the flow.
* Navigate back to your code editor and press return in the terminal to finalize setup.
  * The terminal will look for an existing messenger deployment if it exists, and will create one otherwise, completing the process.

Starting a Message Chat
----------------------
* Login to Gensys Cloud and click on the switch in the top right corner next to the words `Off Queue` to go On Queue.
  * You may see a message stating `You have no phone selected and will not receive calls.`. If this appears, select the `Continue without a phone` option.
  * You will not receive messages unless you are On Queue.
* Go to [Message Chat](https://developer.genesys.cloud/devapps/web-messenger)
  * In the top right corner, click on `Account Selection`, and then `Add Account`. When prompted to select a region, select `CAC1`.
  * Login if prompted to using your credentials.
  * Under the `Chat Configuration` section, click on the `Deployments` dropdown and select your deployment. It should have the name `Dep{shortcode}`.
  * Click on `Start Chat`.
    * You should see a chat button/window appear in the bottom right corner of the window below the deployment dropdown.
    *  Send a message in the chat window and navigate back to Genesys Cloud.
    *  You should see a new conversation appear. You can choose to Answer or Decline, and send messages back and forth between the two chats.
*  You can also send messages from the Genesys Cloud side in an existing conversation through the message_sample.js script:
  *  You will need the conversationId. To obtain this, navigate to the `Network` tab of your browser web tools, and send a message from the Genesys Cloud client to the chat tool.
    *  You should see a network call with an endpoint beginning with `messages`. Click on this call and navigate to the `Response` subtab to find the conversationId. Enter this id into the terminal.
  * You will then need the communicationId. To obtain this, stay within the `Network` tab of the browser web tools and within the same network call, but navigate to the `Headers` subtab and identify the `Request URL`.
    * In the Request URL, identify the string between `communications/` and `/messages`. This is your communicationId. Enter this id into the terminal.
  * You will be prompted to enter messages. You can send as many messages as you want, separated by a new line. They will appear in real-time in Genesys Cloud and in the chat tool.
  * To stop sending messages, press `Ctrl+D` to terminate the script. 
      
Troubleshooting
---------------
* 400: Bad Request
  * If facing 4xx errors with API calls, you may need to acquire a different token.
  * [Login](https://login.cac1.pure.cloud/) to your Genesys Cloud account and open the browser's web tools.
  * Navigate to the console tab, and enter the command `localStorage.getItem("pc_auth")` (You may have to manually enter it or allow pasting).
  * In this project's auth.json file (created when making an API request), replace the value of the attribute `access_token` with the one found in the web tools console.
  * Try the request/command again.
* Unable to perform the requested action. You are missing the following permission(s)...
  * The default permissions provided for hacker accounts may be insufficient for what is being attepmted. Reach out to a Genesys employee for assistance.
