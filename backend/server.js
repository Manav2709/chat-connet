const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv").config();
const connectDb = require("./config/dbConnection");
const errorHandler = require("./middleware/errorHandler");
const User = require("./models/userModel")
const Message = require("./models/messageModel")

// Initialize Express app
const app = express();
app.use(express.json());

// Configure CORS for Express
app.use(cors({
    origin: 'http://localhost:5173', // Your frontend origin
    credentials: true
}));

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173', // Your frontend origin
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Attach io instance to app for use in controllers
app.set("io", io);

// Middleware
app.use(errorHandler);

// API Routes
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/chat/messages", require("./routes/messageRoutes"));
app.use("/api/chat/group", require("./routes/groupRoutes"));
app.use("/api/chat/community", require("./routes/communityRoutes"));

// Add to top of file
const onlineUsers = new Map();

// WebSocket connection handling
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User joins their personal room // using this is important because socket ids change on reload so its important to stay consistent
    // with the id which is solved by joining a room. This helps the user send or receive messages from the room. 
    socket.on('setup', (userId) => {
    
    socket.rooms.forEach(room => socket.leave(room));

    socket.join(userId);
    onlineUsers.set(socket.id, userId);
    console.log(`User ${userId} joined their room`);
    
    // Emit updated active users list to all clients
    io.emit("update-active-users", Array.from(onlineUsers.values()));
    });

    // User joins a group or community chat
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

    socket.on("friend-request", async (request) => {
        try {
            // Update sender's requests
            const senderUpdate = await User.findByIdAndUpdate(
                request.senderId,
                {
                    $addToSet: {
                        friendRequests: {
                            recipientId: request.recipientId,
                            status: 'pending',
                            createdAt: new Date()
                        }
                    }
                },
                { new: true }
            );

            // Update recipient's requests
            await User.findByIdAndUpdate(
                request.recipientId,
                {
                    $addToSet: {
                        friendRequests: {
                            senderId: request.senderId,
                            status: 'pending',
                            createdAt: new Date()
                        }
                    }
                }
            );

            // Broadcast to both users to refresh their lists
            io.to(request.senderId).emit('refresh-users');
            io.to(request.recipientId).emit('new-friend-request', {
                senderId: request.senderId,
                username: senderUpdate.username
            });
            console.log("sender: ", senderUpdate)

        } catch (error) {
            console.error("Friend request error:", error);
        }
    });
    // Handle sending messages
    socket.on("send-message", async (messageData) => {
        try {
            const { text, senderId, receiverId, receiverType } = messageData;

            // Store message in MongoDB
            const newMessage = await Message.create({
                text,
                senderId,
                receiverId,
                receiverType,
                timestamp: new Date()
            });
            // console.log(newMessage)
            // Populate sender data before sending
            const populatedMessage = await Message.findById(newMessage._id)
                .populate('senderId', 'username');

            // Emit message to receiver // also send it back to the sender so that he can update the ui.
            const roomId = receiverType === "user" ? receiverId : `group:${receiverId}`;
            console.log(roomId)
            io.to(senderId).emit("message-sent", populatedMessage);
            io.to(roomId).emit("new-message", populatedMessage);
        } catch (error) {
            console.error("Message sending failed:", error);
        }
    });

    // Add disconnect handler
    socket.on("disconnect", () => {
        const userId = onlineUsers.get(socket.id);
        if (userId) {
            onlineUsers.delete(socket.id);
            console.log(`User ${userId} disconnected and removed from online users.`);
        }
    });

    // Add to socket.io event handlers
    socket.on("typing", (receiverId) => {
        io.to(receiverId).emit("typing", onlineUsers.get(socket.id));
    });

    socket.on("stop-typing", (receiverId) => {
        io.to(receiverId).emit("stop-typing", onlineUsers.get(socket.id));
    });

});

// Add new route before default route
app.get('/api/user/active', async (req, res) => {
    try {
        const userIds = Array.from(onlineUsers.values());
        const users = await User.find({ _id: { $in: userIds } });
        console.log(users)
        res.json(users);
        // console.log(users)
    } catch (error) {
        res.status(500).json({ message: "Error fetching active users" });
    }
});

// Default route
app.get("/", (req, res) => {
    res.send("Hello World");
});

// Connect to database and start server
connectDb();
const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});