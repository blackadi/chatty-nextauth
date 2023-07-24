import { ChatSidebar } from "components/ChatSidebar";
import Head from "next/head";
import { useEffect, useState } from "react";
import { streamReader } from 'openai-edge-stream';
import {v4 as uuid} from "uuid";
import { Message } from "components/Message";
import Spinner from "components/Message/spinner";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { getProviders } from "next-auth/react";
import { getToken } from "next-auth/jwt";
import jwt_decode from "jwt-decode";

export default function ChatPage({ chatId, title, messages = [] }) {
  // console.log("props: " + title, messages);
  const [newChatId, setNewChatId] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState(""); // [ {role: "user", content: "hello"}, {role: "bot", content: "hi"}
  const [messageText, setMessageText] = useState("");
  const [newChatMessages, setNewChatMessages] = useState([]); 
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [fullMessages, setFullMessages] = useState("");
  const [originalChatId, setOriginalChatId] = useState(chatId);
  const router = useRouter();

  const routeHasChanged = chatId !== originalChatId;

  // reset newChatMessages when we navigate to a different route
  //when our route changes
  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);
  }, [chatId])

  //sav the newly streamed message to new chat messages
  useEffect(() => {
    if(!routeHasChanged && !generatingResponse && fullMessages){
      setNewChatMessages(prev => [
        ...prev, 
        {
          _id: uuid(),
          role: "assistant",
          content: fullMessages,
        }
      ]);
      setFullMessages(""); //reset the full messages
    }
  }, [generatingResponse, fullMessages, routeHasChanged])

  //Evertime newChatId or generatingResponse changes, the useEffect will run and navigate to our new chat page
  // if we've created a new chat
  useEffect(() => {
    if(!generatingResponse && newChatId){
      setNewChatId(null); //reset the newChatId so we don't navigate again
      router.push(`/chat/${newChatId}`);
    }
  },[newChatId, generatingResponse, router])
  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the form tag from refreshing the page
    setGeneratingResponse(true);
    setOriginalChatId(chatId);
    setNewChatMessages(prev => {
      const newChatMessages = [
        ...prev, 
        {
        _id: uuid(),
        role: "user",
        content: messageText,
        }
      ];

      return newChatMessages;
    })
    setMessageText("");

    // //via API
    // let content = "";
    // const response = await fetch(`/api/chat/sendMessage`, {
    //     method: "POST",
    //     headers: {
    //         "content-type": "application/json",
    //     },
    //     body: JSON.stringify({ chatId, message: messageText }),
    // });

    // const data = await response.json();

    // console.log("RESPONSE from API: " + JSON.stringify(data));
    // if(!data){
    //   return;
    // }

    // if(data.newChatId?.length > 0){
    //   setNewChatId(data.newChatId)
    // }else{
    //   setIncomingMessage(s => `${s}${data.content}`);
    //   content = content + data.content;
    // }
    // setFullMessages(content);
    // setIncomingMessage(""); //reset the incomming messages
    // setGeneratingResponse(false);



    //via SDK
    let content = "";
    const response = await fetch(`/api/chat/sendMessageSDK`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ chatId, message: messageText }),
    });

    const data = await response.json();
    // console.log("RESPONSE from SDK: " + JSON.stringify(data));

    if(!data){
      return;
    }

    // console.log("data.newChatId?.length: " + data.newChatId?.length);
    if(data.newChatId?.length > 0){
      setNewChatId(data.newChatId)
    }else{
      setIncomingMessage(s => `${s}${data.content}`);
      content = content + data.content;
    }
    setFullMessages(content);
    setIncomingMessage(""); //reset the incomming messages
    setGeneratingResponse(false);

  };

  const allMessages = [...messages, ...newChatMessages];

  return (
    <>
      <Head>
        <title>New Chat</title>
      </Head>
        <div className="grid h-screen grid-cols-[260px_1fr]">
          <ChatSidebar chatId={chatId}/>
          <div className="bg-gray-700 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col-reverse text-white overflow-scroll">
              {!allMessages.length && !incomingMessage &&( //if allmessage.length is false and incomming message is false
              <div className="m-auto justify-center flex items-center text-center">
                <div>
                  <FontAwesomeIcon icon={faRobot} className="text-6xl text-emerald-200"/>
                  <h1 className="text-4xl font-bold text-white/50 mt-2">Ask me a question!</h1>
                </div>
              </div>
              )}
              {!!allMessages.length && (
                <div className="mb-auto">
                {allMessages.map((message) => (
                  <Message 
                    key={message._id} 
                    role={message.role} 
                    content={message.content}
                  />
                ))}
                {!!incomingMessage && !routeHasChanged && (
                  <Message role="assistant" content={incomingMessage}/>
                  )}
                  {!!incomingMessage && !!routeHasChanged && ( //if there is an incomming message and the route has changed is false 
                    <Message 
                      role="notice" 
                      content="Only one message at a time. Please allow any other responses to complete before sending another message" 
                    />
                  )}
                </div>
              )}
            </div>
            <footer className="bg-gray-800 p-10">
              <form onSubmit={handleSubmit}>
                {generatingResponse && (<Spinner />)}
                {!generatingResponse && (
                <fieldset className="flex gap-2" disabled={generatingResponse}>
                  <textarea 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={generatingResponse ? "" :"Send a message...." }
                    className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500" 
                  />
                  <button type="submit" className="btn">Send</button>
                </fieldset>
                )}
              </form>
            </footer>
          </div>
        </div>
    </>
  );
}

//Reload chat list on route change
export const getServerSideProps = async (ctx) => {

  debugger;
  const chatId = ctx.params?.chatId?.[0] || null; // for example this will fetch the chatId from /chat/1234 or /chat/1234/5678 or /chat/1234/5678/91011 or default to null if no chatId is provided
  // console.log("chatId t: " + JSON.stringify(ctx.params));
  if (chatId) {
    let objectId;

    //check if the chatId is a valid MongoDB ObjectId
    try {
      objectId = new ObjectId(chatId);
    } catch (e) {
      return {
        redirect: {
          destination: "/chat", //redirect to the new chat page
        },
      };
    }
    

    // const session = await getServerSession(ctx.req, ctx.res, authOptions);
    // const providers = await getProviders();
    const token = await getToken({req: ctx.req})
    // const decodedToken = jwt_decode(token.accessToken);
    // console.log("providers [[]]: " + JSON.stringify(providers["azure-ad"]));
    // console.log("session: [[]]" + JSON.stringify(token));
    const client = await clientPromise;
    const db = client.db("ChattyAADDev");
    const chat = await db.collection("chats").findOne({
      userId: token.sub,
      _id: objectId,
    });

    if (!chat) {
      return {
        redirect: {
          destination: "/chat", //redirect to the new chat page
        },
      };
    }

    return {
      props: {
        chatId,
        title: chat.title,
        messages: chat.messages.map((message) => ({
          ...message,
          _id: uuid(),
        })),
      },
    };
  }
  return {
    props: {},
  };
};
