import { useSession } from "next-auth/react";
import { faCircleUser, faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import Spinner from "./spinner";

export const Message = ({role, content, generatingResponse}) => {
    const {data: session, status} = useSession(); // load the user from auth0 session
    // console.log("USER: " + JSON.stringify(user));

    return (
        <div className={`grid grid-cols-[40px_1fr] gap-5 p-5 ${role === "assistant" ? "bg-gray-600" : role ==="notice" ? "bg-red-600" : ""}`}>
            <div>
                {role === "user" && status === "authenticated" && (
                    <div>
                        {
                            !!session.user.image && (
                                <Image 
                                    src={session.user.image} 
                                    width={30} 
                                    height={30} 
                                    alt={session.user.name} 
                                    className="rounded-sm shadow-md shadow-black/50 bg-emerald-500"
                                />
                        )}
                        {!session.user.image && (
                            <FontAwesomeIcon 
                                className="rounded-sm shadow-md shadow-black/50" 
                                icon={faCircleUser}
                                size="lg"
                                height={30}
                                width={30}
                                placeholder={session.user.name}
                            />
                        )}
                    
                    </div>
                    // <div class="relative inline-flex items-center justify-center w-auto h-auto overflow-hidden rounded bg-emerald-500">
                    //     <span class="font-medium text-white">{session.user.name}</span>
                    // </div>
                )}
                {role === "assistant" && 
                    <div className="flex h-[30px] w-[30px] items-center justify-center rounded-sm shadow-md shadow-black/50 bg-gray-800">
                        <FontAwesomeIcon icon={faRobot} className="text-emerald-200" beatFade />
                    </div>
                }
            </div>
            <div className="prose prose-invert">
                <ReactMarkdown>{content}</ReactMarkdown>
                {/* {generatingResponse && <Spinner />} */}
            </div>
        </div>
    )
};