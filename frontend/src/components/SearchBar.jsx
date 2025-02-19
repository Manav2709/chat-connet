import React, { useContext, useEffect, useState, useRef } from 'react';
import api from '../apiTokenWrapper';
import { IoIosPersonAdd } from "react-icons/io";
import { FriendsRequestContext } from '../context/FriendRequestsContext';

const SearchBar = ({ loginUserId, socket, focused }) => {
    const [allUsers, setAllUsers] = useState([]); // Store all users
    const [sentFriendRequests, setSentFriendRequests] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const { friends, setFriends } = useContext(FriendsRequestContext);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchContainerRef = useRef(null);

    async function fetchUsers() {
        try {
            const response = await api.get(`/api/user/all-except-me/${loginUserId}`);
            setAllUsers(response.data);
        } catch (error) {
            console.error("User fetch error:", error);
        }
    }
    useEffect(() => {
        
        if (loginUserId) fetchUsers();
    }, [loginUserId]);

    // Handle real-time friend request reception
    useEffect(() => {
        const handleRequestReceived = (request) => {
            console.log("Request received from:", request.username);
            setFriends((prev) => [...prev, request.username]);
        };

        socket.on("new-friend-request", handleRequestReceived);

        return () => {
            socket.off("new-friend-request", handleRequestReceived);
        };
    }, [socket, friends]);

    // Send a friend request
    const sendRequest = async (recipientId) => {
        try {
            // Optimistic update first
            setAllUsers(prev => prev.filter(user => user._id !== recipientId));
            
            // Then send the actual request
            await api.post("/api/user/friend-requests/send", {
                senderId: loginUserId,
                recipientId
            });

            // Emit socket event to trigger server-side updates
            socket.emit("friend-request", {
                senderId: loginUserId,
                recipientId
            });

        } catch (error) {
            // Rollback on error
            setAllUsers(prev => [...prev, allUsers.find(user => user._id === recipientId)]);
            console.error("Request failed:", error);
        }
    };

    // Handle clicks outside the search bar
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setIsSearchFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter users based on search query and remove ones with pending requests
    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!socket) return;

        const handleRefresh = () => {
            fetchUsers(); // Re-fetch users from server
        };

        socket.on('refresh-users', handleRefresh);

        return () => {
            socket.off('refresh-users', handleRefresh);
        };
    }, [socket, loginUserId]);

    return (
        <div className="w-full flex flex-col items-center" ref={searchContainerRef}>
            {/* Search input */}
            <input
                type="text"
                placeholder="Search users..."
                className="w-[250px] p-2 mb-2 text-sm rounded outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
            />

            {(isSearchFocused || focused) && (
                <ul className="w-[250px] z-10 bg-white/60 p-2 rounded shadow-lg">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <li key={user._id} className="flex text-black items-center text-lg gap-2 justify-between">
                                {user.username}
                                <IoIosPersonAdd
                                    className="cursor-pointer hover:text-amber-200"
                                    onClick={() => sendRequest(user._id)}
                                />
                            </li>
                        ))
                    ) : (
                        <li className="text-black text-center py-2">No users found</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;