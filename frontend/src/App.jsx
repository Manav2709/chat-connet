import { useState } from 'react'
import { RouterProvider } from 'react-router-dom';
import './App.css'

import router from '../src/routes/router';
import { SocketLoginContextProvider } from './context/SocketLoginContext';
import { FriendsRequestContextProvider } from './context/FriendRequestsContext';

function App() {


  return (
  <>
  <FriendsRequestContextProvider>
  <SocketLoginContextProvider>
  <RouterProvider router={router}/>
  </SocketLoginContextProvider>
  </FriendsRequestContextProvider>
  </>
  )
}

export default App
