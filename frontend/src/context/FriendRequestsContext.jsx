import { createContext, useState } from 'react';

export const FriendsRequestContext = createContext()


export const FriendsRequestContextProvider = ({children}) => {
    const [friends, setFriends] = useState([])

    return (
        <FriendsRequestContext.Provider value={{friends, setFriends}}>
            {children}
        </FriendsRequestContext.Provider>
    )
}