import { getServerSession } from "next-auth/next";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "../auth/[...nextauth]";
import { getProviders } from "next-auth/react";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
    try{
        // const session = await getServerSession(req, res, authOptions);
        // const providers = await getProviders();
        const token = await getToken({req})
        // const decoded = jwt_decode(token.accessToken);

        const client = await clientPromise;
        const db = client.db("ChattyAADDev");

        const { chatId, role, content } = req.body;
        // console.log("chatId from add page",chatId);
        // const chatId = token.sub;
        // const chatId = decoded.oid;

        let objectId;

        //check if the chatId is a valid MongoDB ObjectId
        try {
            objectId = new ObjectId(chatId);
        } catch (e) {
            res.status(422).json({
                message: "chatId is Invalid and must be a valid MongoDB ObjectId",
            });
            return;
        } 

        //validate content data,  
        if (
            !content ||
            typeof content !== "string" ||
            (role === "user" && content.length > 200) ||
            (role === "assistant" && content.length > 100000)
          ) {
            res.status(422).json({
                message: "content is required and must be a string with a maximum length of 200 characters",
            });
            return;
        }
            
        // validate role
        if (role !== "user" && role !== "assistant") {
            res.status(422).json({
                message: "role is required and must be either 'user' or 'assistant'",
            })
            return;
        }

        const chat = await db.collection("chats").findOneAndUpdate(
            {
                _id: objectId,
                userId: token.sub,
              },
              {
                $push: {
                  messages: {
                    role,
                    content,
                  },
                },
              },
              {
                returnDocument: "after",
              }
            );

            res.status(200).json({
                chat: {
                    ...chat.value,
                    _id: chat.value._id.toString(),
                },
            });
    }
    catch(error){
        res
            .status(500)
            .json({ message: 'An error occurred when adding a message to chat list', error })
    }
}