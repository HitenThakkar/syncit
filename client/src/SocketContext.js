import { createContext } from "react";
import { io } from "socket.io-client";

export const socket = io("http://192.168.29.117:4000")
export const SocketContext = createContext();
