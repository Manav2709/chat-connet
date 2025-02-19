import { createContext, useState } from 'react';

export const SocketLoginContext = createContext();


export const SocketLoginContextProvider = ({children}) => {
    const [socket, setSocket] = useState(null)

    return(
       <SocketLoginContext.Provider value={{socket, setSocket}} >
        {children}
       </SocketLoginContext.Provider>
    )
} 