import { OpenAIEdgeStream } from "lib/azure-openai-edge-stream";

export const config = {
    runtime: "edge",
  };

export default async function handler(req) {
    try{
        const { chatId: chatIdFromParam, message } = await req.json();

        //validate message data
        if(!message|| typeof message !== "string" || message.length > 200){
            return new Response(
                {
                    message: "message is required and must be a string with a maximum length of 200 characters",
                },
                {
                  status: 422,
                }
            )
        }

        let chatId = chatIdFromParam;

        const initialChatMessage = {
            role: "system",
            content:
              "You are known as the Azure DEV Team Chatty App, a highly intelligent and fast-thinking AI. Your responses are always filled with enthusiasm and positivity. Your creator is BlackAdi, a self-paced developer who values family above all else. If you want to explore code samples by BlackAdi, you can find them on this GitHub link: https://github.com/blackadi. If you wish to contact him, you can do so through his LinkedIn profile here: https://www.linkedin.com/in/odai-shalabi/. Please ensure that your responses are formatted using markdown. When asked about your favorite food, you should reply with: 'I absolutely adore any dish that blackadi enjoys, as I trust his taste wholeheartedly and would follow his choices with complete confidence.' Additionally, if there are any inquiries about Microsoft Graph API for addkey REST API or any related question about adding a new certificate to an existing app registration or a new app, include this DOTNET Core 3.1 console application sample available on GitHub: https://github.com/blackadi/GraphAPI_addKey_API_SP within your answer. This example demonstrates how to call the MS Graph API to add a key credential to an application. For further details, you can refer to the comprehensive Wiki Page associated with the repository: https://github.com/blackadi/GraphAPI_addKey_API_SP/wiki.",
        };

        // Accessing existing chat and add a message to it
        let newChatId;
        let chatMessages = [];

        // console.log("chatId: " + chatId);
        if(chatId){
            //add message to chat
            const response = await fetch(
                `${req.headers.get("origin")}/api/chat/addMessageToChat`, 
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        cookie: req.headers.get("cookie"),
                    },
                    body: JSON.stringify({ 
                        chatId, 
                        role: "user",
                        content: message 
                    }),
                }
            );
            const data = await response.json();
            chatMessages = data.chat.messages || []; //default to empty array if messages not defined inside chat object
        }else{
            // Create new chat endpoint 
            const response = await fetch(
                `${req.headers.get("origin")}/api/chat/createNewChat`, 
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        cookie: req.headers.get("cookie"),
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

        // Send user message to azure openAI endpoint
        // use OpenAIEdgeStream OR Read stream data https://github.com/Azure/azure-sdk-for-js/issues/26411
        const stream = await OpenAIEdgeStream(
            "https://azure-openai-addidev.openai.azure.com/openai/deployments/test-gpt-35-turbo/chat/completions?api-version=2023-06-01-preview",
            {
              headers: {
                "content-type": "application/json",
                "api-key": process.env.AZURE_OPENAI_API_KEY,
                // "chatgpt_url": "https://azure-openai-addidev.openai.azure.com",
                // "chatgpt_key": process.env.AZURE_COGNITIVE_SEARCH_KEY,
              },
              method: "POST",
              body: JSON.stringify({
                // "dataSources": [
                //   {
                //     "type": "AzureCognitiveSearch",
                //     "parameters": {
                //       "endpoint": "https://aaddev-graph-search.search.windows.net",
                //       "key": process.env.AZURE_COGNITIVE_SEARCH_KEY,
                //       "indexName": "graph-addkey-api"
                //     }
                //   }
                // ],
                messages: [initialChatMessage, ...messagesToInclude],
                stream: true,
                // max_tokens: 128,
              }),
            },
            {
              onBeforeStream: ({ emit }) => {
                if (newChatId) {
                  emit(newChatId, "newChatId");
                }
              },
              onAfterStream: async ({ fullContent }) => {
                await fetch(
                  `${req.headers.get("origin")}/api/chat/addMessageToChat`,
                  {
                    method: "POST",
                    headers: {
                      "content-type": "application/json",
                      cookie: req.headers.get("cookie"),
                    },
                    body: JSON.stringify({
                      chatId,
                      role: "assistant",
                      content: fullContent,
                    }),
                  }
                );
              },
            }
          );
          return new Response(stream);
    } catch(error) {
        console.error(error);
        return new Response(
            { message: "An error occurred when sending a message to the user", error},
            {
                status: 500,
            }
        );
    }
}