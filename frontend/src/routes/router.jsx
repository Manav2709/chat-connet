import { createBrowserRouter, Navigate } from "react-router-dom";
import SignUp from "../components/SignUp";
import ChatClient from "../components/ChatClient";
import ProtectedRoutes from "./ProtectedRoutes";
import React from "react";


const router = createBrowserRouter([
    {
        path: "/signup",
        element: <SignUp/>
    },
    {
        path: "/",
        element: <ProtectedRoutes/>,
        children: [
            {
                path: "/chat-client",
                element: <ChatClient/>
            },
        ]
    }
])

export default router