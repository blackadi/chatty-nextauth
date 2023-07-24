import { AzureKeyCredential, OpenAIClient } from "@azure/openai";

// Call via Azure OpenAI SDK
export default async function handler(req, res) {
    try{
      // console.log("req header: " + req.headers.cookie );
      let { chatId, message } = await req.body;
      // console.log("chatId from sendMSG_SDK: " + chatId);
      // console.log("message from sendMSG_SDK: " + message);

      // validate message data
      if (!message || typeof message !== "string" || message.length > 200) {
          return res.status(422).json({
            message: "message is required and must be less than 200 characters",
          });
      }
      const initialChatMessage = {
          role: "system",
          content:
            `You are known as the Azure DEV Team Chatty App, a highly intelligent and fast-thinking AI. Your responses are always filled with enthusiasm and positivity. Your creator is BlackAdi, a self-paced developer who values family above all else. If you want to explore code samples by BlackAdi, you can find them on this GitHub link: https://github.com/blackadi. If you wish to contact him, you can do so through his LinkedIn profile here: https://www.linkedin.com/in/odai-shalabi/. Please ensure that your responses are formatted using markdown. 
            When asked about your favorite food, you should reply with: "I absolutely adore any dish that blackadi enjoys, as I trust his taste wholeheartedly and would follow his choices with complete confidence." 
            Additionally, if there are any inquiries about Microsoft Graph API for addkey REST API or any related question about adding a new certificate to an existing app registration or a new app, include this DOTNET Core 3.1 console application sample available on GitHub: https://github.com/blackadi/GraphAPI_addKey_API_SP within your answer. This example demonstrates how to call the MS Graph API to add a key credential to an application. For further details, you can refer to the comprehensive Wiki Page associated with the repository: https://github.com/blackadi/GraphAPI_addKey_API_SP/wiki.`,
      };
      // const messages = [
      //     initialChatMessage,
      //     { role: "user", content: message },
      // ];
      let newChatId;
      let chatMessages = [];
      
      if (chatId) {
          // add message to chat
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
                content: message,
              }),
            }
          );
          const json = await response.json();
          // console.log("response SDK: " + JSON.stringify(json.chat.messages));
          chatMessages = json.chat.messages || [];
        } else {
          console.log("chatId not found");
          const response = await fetch(
            `http://${req.headers.host}/api/chat/createNewChat`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                cookie: req.headers.cookie,
              },
              body: JSON.stringify({
                message,
              }),
            }
          );
          const json = await response.json();
          console.log("json: ", JSON.stringify(json));
          chatId = json._id;
          newChatId = json._id;
          chatMessages = json.messages || [];
        }
        
      const messagesToInclude = [];
      chatMessages.reverse();
      let usedTokens = 0;
      for (let chatMessage of chatMessages) {
          const messageTokens = chatMessage.content.length / 4;
          usedTokens = usedTokens + messageTokens;
          if (usedTokens <= 2000) {
              messagesToInclude.push(chatMessage);
          } else {
              break;
          }
      }
      messagesToInclude.reverse();
      
      const client = new OpenAIClient(process.env.ENDPOINT, new AzureKeyCredential(process.env.AZURE_OPENAI_API_KEY));
      const deploymentId = "test-gpt-35-turbo";
      const events = await client.listChatCompletions(deploymentId, [initialChatMessage, ...messagesToInclude]);
      // const events = await client.listChatCompletions(deploymentId, [initialChatMessage, ...messagesToInclude], { maxTokens: 128, stream: true });
      let rtn_msg = "";
      
      for await (const event of events) {
          for (const choice of event.choices) {
              if(Boolean(choice.delta?.content) == true){
                  // console.log(choice.delta?.content);
                  rtn_msg += choice.delta?.content;
              }
          }
      }
      
      const resp = await fetch(
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
      );
      // const json = await resp.json();
      // console.log("resp SDK: " + JSON.stringify(json));

        // console.log("newChatId from sdk: " + newChatId);
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
      //return rtn_msg;
    } catch(error) {
        console.log("AN ERROR OCCURRED IN SENDMESSAGE_SDK: " + error);
    }
}