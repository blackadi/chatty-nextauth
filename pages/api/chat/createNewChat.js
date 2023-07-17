import { getServerSession } from "next-auth/next";
import clientPromise from "lib/mongodb";
import { authOptions } from "../auth/[...nextauth]";
import { getProviders } from "next-auth/react";
import { getToken } from "next-auth/jwt";
import jwt_decode from "jwt-decode";

export default async function handler(req, res) {
    try{
        // const session = await getServerSession(req, res, authOptions);
        // const providers = await getProviders();
        const token = await getToken({req})
        // const decoded = jwt_decode(token.accessToken);
        // console.log("oid create new chat: ", decoded.oid);

        const {message} = req.body;

        //validate message data
        if(!message|| typeof message !== "string" || message.length > 200){
            res.status(422).json({
                message: "message is required and must be a string with a maximum length of 200 characters",
            })
            return;
        }

        const newUserMessage = {
            role: "user",
            content: message,
        }
        const client = await clientPromise;
        const db = client.db("ChattyAADDev");
        console.log("token.sub: ", token.sub);
        const newChat = await db.collection("chats").insertOne({
            userId: token.sub,
            messages: [newUserMessage],
            title: message,
        });
        console.log("newChat: ", newChat.insertedId);
        res.status(200).json({
            _id: newChat.insertedId,
            messages: [newUserMessage],
            title: message,
        });
    } catch(error) {
        res
            .status(500)
            .json({message: "An error occurred when creating a new chat" + error});
    }
}