import { createContext } from "react";
import { io } from "socket.io-client";

export const socket = io("https://syncit-2nvy.onrender.com/")
export const SocketContext = createContext();
