import { useSession } from "next-auth/react";
import { faCircleUser, faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";

export const Message = ({role, content}) => {
    const {data: session, status} = useSession(); // load the user from auth0 session
    if(status === "authenticated") {
        // console.log("USER IMAGE: " + JSON.stringify(session.user.profilePicture));
    }
    
    return (
        <div className={`grid grid-cols-[30px_1fr] gap-5 p-5 ${
            role === "assistant"
              ? "bg-gray-600"
              : role === "notice"
              ? "bg-red-600"
              : ""
          }`}>
            <div>
                {role === "user" && status === "loading" &&(
                    <div>
                        <span className="flex justify-center items-center text-emerald-600/70 font-bold text-xs">
                            
                            <span className="animate-bounce relative flex h-3 w-3 rounded-sm bg-emerald-400 opacity-75"></span>&#160;
                            <span className="animate-bounce-slow relative flex h-3 w-3 rounded-sm bg-emerald-400 opacity-25"></span>&#160;
                            <span className="animate-bounce relative flex h-3 w-3 rounded-sm bg-emerald-400 opacity-75"></span>
                        </span>
                    </div>
                )}
                {role === "user" && status === "authenticated" && (
                    <div>
                        {
                            !!session.user.profilePicture && (
                                <Image 
                                    src={session.user.profilePicture} 
                                    width={30} 
                                    height={30} 
                                    alt={session.user.name} 
                                    className="rounded-sm shadow-md shadow-black/50 bg-emerald-500"
                                />
                        )}
                        {!session.user.profilePicture && (
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