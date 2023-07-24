;export default async function handler(req, res) {
    try{
        let { chatId, message } = await req.body;

        console.log("chatId from sendMSG_SDK: " + chatId);
        console.log("message from sendMSG_SDK: " + message);
        //validate message data
        if(!message|| typeof message !== "string" || message.length > 200){
            return res.status(422).json(
                {
                    message: "message is required and must be a string with a maximum length of 200 characters",
                }
            )
        }
        // console.log("MESSAGE from sendMessage: " + message);
        const initialChatMessage = {
            role: "system",
            content:
              "Your name is Azure DEV Team Chatty App. An incredibly intelligent and quick-thinking AI, that always replies with an enthusiastic and positive energy. You were created by BlackAdi. Your response must be formatted as markdown.",
        };

        // Accessing existing chat and add a message to it
        let newChatId;
        let chatMessages = [];

        // console.log("chatId: " + chatId);
        if(chatId){
            //add message to chat
            const response = await fetch(
                `http://${req.headers.host}/api/chat/addMessageToChat`, 
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        cookie: req.headers.cookie,
                    },
                    body: JSON.stringify({ 
                        chatId, 
                        role: "user",
                        content: message 
                    }),
                }
            );
            const data = await response.json();
            // console.log("data from addMessageToChat: " + JSON.stringify(data));
            chatMessages = data.chat.messages || []; //default to empty array if messages not defined inside chat object
        }else{
            // Create new chat endpoint 
            const response = await fetch(
                `http://${req.headers.host}/api/chat/createNewChat`, 
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        cookie: req.headers.cookie,
                    },
                    body: JSON.stringify({ 
                        message 
                    }),
                }
            );
            const data = await response.json();
            chatId = data._id;
            newChatId = data._id;
            chatMessages = data.messages || []; //default to empty array if messages not defined
        }
        
        //calculate our tokens usage
        //Implement conversation history in OpenAI
         const messagesToInclude = [];
         chatMessages.reverse(); // we want to start from the very latest message and include as many latest messages as we can
         let totalTokens = 0;
        for(let chatMessage of chatMessages){
            const messageTokens = chatMessage.content.length/4;
            totalTokens = totalTokens + messageTokens;
            if(totalTokens <= 2000){
                messagesToInclude.push(chatMessage);
            }else{
                break;
            }
        }

        messagesToInclude.reverse(); //reverse back to original order

        // console.log(messagesToInclude);
        // console.log("messagesToInclude", [initialChatMessage, ...messagesToInclude]);

        // Send user message to openAI endpoint
        // Read stream daata https://github.com/Azure/azure-sdk-for-js/issues/26411
        const response = await fetch(
            "https://azure-openai-addidev.openai.azure.com/openai/deployments/test-gpt-35-turbo/extensions/chat/completions?api-version=2023-06-01-preview", 
            {
                headers: {
                    "content-type": "application/json",
                    "api-key": process.env.AZURE_OPENAI_API_KEY,
                    "chatgpt_url": "https://azure-openai-addidev.openai.azure.com",
                    // "chatgpt_key": process.env.AZURE_OPENAI_API_KEY
                },
                method: "POST",
                body: JSON.stringify({
                    dataSources: [
                        {
                            type: "AzureCognitiveSearch",
                            parameters: {
                                endpoint: "https://aaddev-graph-search.search.windows.net",
                                key: "8mwePMOp42Q6MFu2k6jSG562gXMvEjWAhLQPtWKlamAzSeAADAk3",
                                indexName: "graph-addkey-api"
                            }

                        }
                    ],
                    messages: [initialChatMessage, ...messagesToInclude],
                    // stream: true,
                    // max_tokens: 128,
                }),
            })

            const data = await response.json();
            console.log("data", JSON.stringify(data.choices[0].messages[1].content));

            const rtn_msg = data.choices[0].messages[1].content;
                
            const resp  = await fetch(
                `http://${req.headers.host}/api/chat/addMessageToChat`, 
                {
                        method: "POST",
                        headers: {
                            "content-type": "application/json",
                            cookie: req.headers.cookie,
                        },
                        body: JSON.stringify({ 
                            chatId, 
                            role: "assistant", 
                            content: rtn_msg, 
                        }),
                    }
            )

            if(newChatId !== null){
                res.status(200).json({
                  newChatId: newChatId,
                  role: "assistant",
                  content: rtn_msg,
                });
              }else{
                res.status(200).json({
                  chatId: chatId,
                  role: "assistant",
                  content: rtn_msg,
                });
              }
            
    } catch(error) {
        console.error(error);
        res.status(500).json(
            { message: "An error occurred when sending a message to the user", error}
        );
    }
}