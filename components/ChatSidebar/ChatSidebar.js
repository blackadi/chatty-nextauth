import { faMessage, faPlus, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export const ChatSidebar = ({chatId}) => {
  const [chatList, setChatList] = useState([]); 

  const logout = async () => {
    const { data: {path}} = await axios.get('/api/auth/logout');
    await signOut({ redirect: false });
    window.location.href = path;
  }

  useEffect(() => {
    const loadChatList = async () => {
      const response = await fetch(`/api/chat/getChatList`, {
        method: "POST",
      });
      const data = await response.json();
      // console.log("CHAT LIST: " + JSON.stringify(data));
      setChatList(data?.chats || []);
    }
    loadChatList();
  }, [chatId]); //reloads chat list when chatId changes

    return (
        <div className="flex flex-col overflow-hidden bg-gray-900 text-white">
            <Link href="/chat" className="side-menu-item bg-emerald-500 hover:bg-emerald-600">
              <FontAwesomeIcon icon={faPlus} />
              New Chat</Link>
            <div className="flex-1 overflow-auto bg-gray-950">
              {chatList.map((chat) => (
                <Link 
                  href={`/chat/${chat._id}`} 
                  key={chat._id} 
                  className={`side-menu-item ${chatId === chat._id ? 'bg-gray-700 hover:bg-gray-700' : ''}}`}
                >
                  <FontAwesomeIcon icon={faMessage} className="text-white/50" />
                  <span title={chat.title} className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {chat.title}
                  </span>
                </Link>
              ))}
            </div>
            <button onClick={() => logout()} className="side-menu-item">
              <FontAwesomeIcon icon={faRightFromBracket} />
              Logout
            </button>
        </div>
    );
}