import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { SocketLoginContext } from '../context/SocketLoginContext';
import api from "../apiTokenWrapper";
import SearchBar from "./SearchBar";
import { FaUserFriends } from "react-icons/fa";
import { MdCancel } from "react-icons/md";



import BadgeNotification from "./Badge";
import RequestsModal from "./RequestsModal";


function ChatClient() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [room, setRoom] = useState("")
  const [socketId, setSocketId] = useState("")
  const [roomName, setRoomName] = useState("")
  const [user, setUser] = useState("")
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loginUserId, setLoginUserId] = useState("")
  const [recentMessages, setRecentMessages] = useState({}); // Store recent messages
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const lastTypingTime = useRef(Date.now());
  const dialog = useRef(null)
  const [openDialog, setOpenDialog] = useState(false)


  const socket  = useMemo(() => io('http://localhost:3001'), []);

  async function fetchUser() {
    try {
      const response = await api.get("/api/user/current")
      setUser(response.data.username)
      setLoginUserId(response.data.id)

    } catch (error) {
      console.log(error)
    }
  }



  useEffect(() => {
    fetchUser()
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      setMessages([]);
      api.get(`/api/chat/messages/user/${selectedRoom}`)
        .then(res => {
          const formattedMessages = res.data.map(msg => ({
            ...msg,
            senderId: msg.senderId?._id ? msg.senderId : { _id: msg.senderId }
          }));
          setMessages(formattedMessages);
          
          // Update recent message for selectedRoom
          if (formattedMessages.length > 0) {
            setRecentMessages(prev => ({
              ...prev,
              [selectedRoom]: formattedMessages[formattedMessages.length - 1].text
            }));
          }
        })
        .catch(console.error);
    }
  }, [selectedRoom, loginUserId]);

  // useEffect(() => {
  //   const fetchActiveUsers = () => {
  //     api.get('/api/user/active')
  //       .then(res => {
  //         setActiveUsers(res.data.filter(user => user._id.toString() !== loginUserId.toString()));
  //       })
  //       .catch(console.error);
  //   };
  //   fetchActiveUsers();
  //   const interval = setInterval(fetchActiveUsers, 10000);
  //   return () => clearInterval(interval);
  // }, [loginUserId]);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const res = await api.get('/api/user/active');
        const users = res.data.filter(user => 
          user._id.toString() !== loginUserId.toString()
        );
        setActiveUsers(users);

        // Fetch latest messages for each active user
        const recentMsgs = {};
        await Promise.all(
          users.map(async (user) => {
            try {
              const msgRes = await api.get(`/api/chat/messages/user/${user._id}`);
              if (msgRes.data.length > 0) {
                recentMsgs[user._id.toString()] = msgRes.data[msgRes.data.length - 1].text;
              } else {
                recentMsgs[user._id.toString()] = "No messages yet";
              }
            } catch (error) {
              console.error("Error fetching messages:", error);
            }
          })
        );
  
        setRecentMessages(recentMsgs);
      } catch (error) {
        console.error(error);
      }
    };

    fetchActiveUsers(); // Fetch initially

    // Set up a socket listener for active users update
    const handleActiveUsersUpdate = (activeUsers) => {
        console.log("Active users updated:", activeUsers);
        setActiveUsers(activeUsers);
    };

    socket.on("update-active-users", handleActiveUsersUpdate); // Listen to server updates

    // Poll every 10 seconds
    const interval = setInterval(fetchActiveUsers, 10000);

    return () => {
        clearInterval(interval); // Clear interval on unmount
        socket.off("update-active-users", handleActiveUsersUpdate); // Cleanup listener
    };
}, [loginUserId, socket]);

  const setupSocket = () => {
    socket.on("connect", () => {
      setSocketId(socket.id);
      socket.emit('setup', loginUserId);
    });

    socket.on("typing", (userId) => {
      console.log(`Received typing from ${userId}`);
      setTypingUsers(prev => new Set([...prev, userId]));
    });

    socket.on("stop-typing", (userId) => {
      console.log(`Received stop-typing from ${userId}`);
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socket.on("message-sent", (message) => {
      if (message.receiverId === selectedRoom) {
        setMessages(prev => {
          if (!prev.some(msg => msg._id === message._id)) {
            return [...prev, message];
          }
          return prev;
        });

        // Update recent message for receiver
        setRecentMessages(prev => ({
          ...prev,
          [message.receiverId]: message.text
        }));
      }
    });

    socket.on("new-message", (message) => {
      if (message.senderId._id === selectedRoom || message.receiverId === selectedRoom) {
        setMessages(prev => {
          if (!prev.some(msg => msg._id === message._id)) {
            return [...prev, message];
          }
          return prev;
        });
      }

      
      // Update recent message for sender
      setRecentMessages(prev => ({
        ...prev,
        [message.senderId._id]: message.text
      }));
    });

    

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new-message");
      socket.off("message-sent");
    };
  };

  useEffect(() => {
    if (loginUserId || selectedRoom) {
      setupSocket();
    }
  }, [loginUserId, selectedRoom]); 

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', selectedRoom);
    }
    lastTypingTime.current = Date.now();
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedRoom) return;
    
    const messageData = {
      text: newMessage,
      senderId: loginUserId,
      receiverId: selectedRoom,
      receiverType: "user"
    };

    socket.emit('send-message', messageData);
    
    // Update recent message for sender
    setRecentMessages(prev => ({
      ...prev,
      [selectedRoom]: newMessage
    }));

    setNewMessage("");
    socket.emit('stop-typing', selectedRoom);
    setIsTyping(false);
  };

  //dialog useEffect
  useEffect(() => {
    if (openDialog) {
      dialog.current.showModal()
      // Add click-outside handler for non-modal dialogs (if needed)
      dialog.current.addEventListener('click', (e) => {
        const dialogDimensions = dialog.current.getBoundingClientRect()
        if (
          e.clientX < dialogDimensions.left ||
          e.clientX > dialogDimensions.right ||
          e.clientY < dialogDimensions.top ||
          e.clientY > dialogDimensions.bottom
        ) {
          setOpenDialog(false)
        }
      })
    } else {
      dialog.current.close()
    }
  }, [openDialog])

  // Add typing timeout check
  useEffect(() => {
    const checkTyping = () => {
      const timeSinceLastTyping = Date.now() - lastTypingTime.current;
      if (isTyping && timeSinceLastTyping > 3000) {
        socket.emit('stop-typing', selectedRoom);
        setIsTyping(false);
      }
    };


    
    const interval = setInterval(checkTyping, 1000);
    return () => clearInterval(interval);
  }, [isTyping, selectedRoom]);

  return (
    <>
    <dialog 
      ref={dialog} 
      onClose={() => setOpenDialog(false)}
      className="backdrop:bg-black/50 rounded-lg p-6 shadow-xl absolute top-50 left-150"
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Users</h2>
          <button 
            onClick={() => setOpenDialog(false)}
            className="text-2xl hover:text-gray-700 outline-none"
          >
            <MdCancel/>
          </button>
        </div>
        <SearchBar loginUserId={loginUserId} socket={socket} focused={true}/>
      </div>
    </dialog>
      <div className="w-full h-screen bg-black flex flex-col justify-center items-start">
        <div className="text-white absolute top-6 left-10 text-lg">
          Hello, {user}!
        </div>
        <div className="flex gap-20 h-[75vh] justify-center w-full mb-20">
          <div className="w-[40vh] rounded-lg flex flex-col gap-3 ">
            <div className="h-16 bg-slate-500/25 rounded-lg p-4 text-white z-1">
              {/* Active Users ({activeUsers.length}) */}
              <SearchBar loginUserId={loginUserId} socket={socket}/>

            </div>
            <div className="h-[73vh] bg-slate-700/40 rounded-lg p-2 overflow-y-auto">
              {activeUsers.map(user => (
                <div 
                  key={user._id}
                  onClick={() => setSelectedRoom(user._id)}
                  className={`p-2 cursor-pointer rounded mb-1 transition-all ${
                    selectedRoom === user._id 
                      ? 'bg-white/10 text-white px-4 py-2 rounded-lg' 
                      : 'hover:bg-slate-600'
                  }`}
                >
                  <span className="text-white">{user.username}</span>
                  <p className="text-gray-400 text-sm truncate">
                    {typingUsers.has(user._id) ? "typing..." : 
                     recentMessages[user._id] || "No messages yet"}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-[70vh] lg:h-[75vh]  flex flex-col w-[40vh] ">
            <div className="h-16 items-center  bg-[#fca311] backdrop-blur-md gap-4 shadow-md px-6 py-3 z-50 pb-12 mb-3 rounded-md flex justify-end  ">
              <FaUserFriends className="text-[26px] mt-10 cursor-pointer" onClick={() => setOpenDialog(!openDialog)}/>
              <RequestsModal/>
            </div>
            <div className="h-16 bg-slate-700/40 p-4 text-white">
              {selectedRoom ? `${
                activeUsers.find(u => u._id === selectedRoom)?.username
              }` : "Select a user to chat"}
            </div>
            <div className="bg-slate-600/40 h-[75vh] overflow-y-auto p-4">
              {messages.map((msg) => (
                <div key={msg._id} className={`mb-2 ${
                  msg.senderId._id === loginUserId 
                    ? 'text-right' 
                    : 'text-left'
                }`}>
                  <div className={`inline-block p-2 rounded-lg ${
                    msg.senderId._id === loginUserId
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700 text-white'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {typingUsers.has(selectedRoom) && (
                <div className="text-left mb-2">
                  <div class="chat-bubble">
                <div class="typing">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                </div>
                </div>
                </div>
              )}
            </div>
            { selectedRoom &&
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 p-2 rounded bg-slate-800 text-white"
                placeholder="Type a message..."
              />
              <button 
                onClick={sendMessage}
                className="bg-gradient-to-r from-purple-400 to-purple-600 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Send
              </button>
            </div>
}
          </div>

          <div className="w-[40vh] rounded-lg flex flex-col gap-3">
            <div className="h-16 bg-slate-500/25 rounded-lg p-4 text-white">
              Active Users ({activeUsers.length})
            </div>
            <div className="h-[73vh] bg-slate-700/40 rounded-lg p-2 overflow-y-auto">
              {activeUsers.map(user => (
                <div 
                  key={user._id}
                  onClick={() => setSelectedRoom(user._id)}
                  className={`p-2 cursor-pointer rounded mb-1 transition-all ${
                    selectedRoom === user._id 
                      ? 'bg-white/10 text-white px-4 py-2 rounded-lg' 
                      : 'hover:bg-slate-600'
                  }`}
                >
                  <span className="text-white">{user.username}</span>
                  <p className="text-gray-400 text-sm truncate">
                    {typingUsers.has(user._id) ? "typing..." : 
                     recentMessages[user._id] || "No messages yet"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChatClient;