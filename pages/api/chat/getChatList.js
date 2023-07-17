import { getServerSession } from "next-auth/next";
import clientPromise from "lib/mongodb";
import { getProviders } from "next-auth/react";
import { authOptions } from "../auth/[...nextauth]";
import { getToken } from "next-auth/jwt";
import jwt_decode from "jwt-decode";

export default async function handler(req, res) {
    try{
        // const session = await getServerSession(req, res, authOptions);
        const token = await getToken({req})
        // const decoded = jwt_decode(token.accessToken);
        // const providers = await getProviders();
        
        const client = await clientPromise;
        const db = client.db("ChattyAADDev");
        const chats = await db
            .collection("chats")
            .find(
                { 
                    userId: token.sub 
                }, 
                { 
                    projection: { 
                        userId: 0, 
                        messages: 0 
                    },
                }
            )
            .sort({ 
                _id: -1 
            })
            .toArray();

        res.status(200).json({chats});
    }catch(error){
        res.
            status(500).
            json({ message: 'An error occurred when getting the chat list' })
    }
  }