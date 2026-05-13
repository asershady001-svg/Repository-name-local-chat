const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  maxHttpBufferSize: 15 * 1024 * 1024
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "20mb" }));

app.get("/api/app-version", (req, res) => {
  res.json({ ok: true, version: APP_VERSION });
});

const messagesFile = path.join(__dirname, "messages.json");
const usersFile = path.join(__dirname, "users.json");
const chatsFile = path.join(__dirname, "chats.json");
const contactsFile = path.join(__dirname, "contacts.json");
const APP_VERSION = "login-fix-private-chat-2026-05-12-2128";

let allowedUsers = {
  "Ø£Ø³Ø±": "",
  "Ø§Ø³Ø±": "",
  "Ù…Ø­Ù…Ø¯": "1234",
  "Ø´Ø§Ø¯ÙŠ": "1234",
  "Ø¬ÙˆØ¯ÙŠ": "1234",
  "Ø¹Ù…Ø±": "1234",
  "admin": "admin123"
};

let chats = [];

let messageHistory = {};
let contacts = {};

function saveUsers() {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(allowedUsers, null, 2), "utf8");
  } catch (error) {
    console.log("Error saving users.json:", error.message);
  }
}

function loadUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, "utf8");
      const savedUsers = JSON.parse(data);
      allowedUsers = { ...allowedUsers, ...savedUsers };
      allowedUsers["Ø£Ø³Ø±"] = allowedUsers["Ø£Ø³Ø±"] || "";
      allowedUsers["Ø§Ø³Ø±"] = allowedUsers["Ø§Ø³Ø±"] || "";
      saveUsers();
      console.log("Users loaded from users.json");
    } else {
      saveUsers();
      console.log("users.json created");
    }
  } catch (error) {
    console.log("Error loading users.json:", error.message);
  }
}

function saveContacts() {
  try {
    fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2), "utf8");
  } catch (error) {
    console.log("Error saving contacts.json:", error.message);
  }
}

function loadContacts() {
  try {
    if (fs.existsSync(contactsFile)) {
      const data = fs.readFileSync(contactsFile, "utf8").replace(/^\uFEFF/, "");
      contacts = JSON.parse(data || "{}") || {};
      saveContacts();
      console.log("Contacts loaded from contacts.json");
    } else {
      saveContacts();
      console.log("contacts.json created");
    }
  } catch (error) {
    console.log("Error loading contacts.json:", error.message);
  }
}

function saveChats() {
  try {
    fs.writeFileSync(chatsFile, JSON.stringify(chats, null, 2), "utf8");
  } catch (error) {
    console.log("Error saving chats.json:", error.message);
  }
}

function loadChats() {
  try {
    if (fs.existsSync(chatsFile)) {
      const data = fs.readFileSync(chatsFile, "utf8");
      const savedChats = JSON.parse(data);
      if (Array.isArray(savedChats) && savedChats.length > 0) {
        chats = savedChats;
      }
      saveChats();
      console.log("Chats loaded from chats.json");
    } else {
      saveChats();
      console.log("chats.json created");
    }
  } catch (error) {
    console.log("Error loading chats.json:", error.message);
  }
}

function saveMessages() {
  try {
    fs.writeFileSync(messagesFile, JSON.stringify(messageHistory, null, 2), "utf8");
  } catch (error) {
    console.log("Error saving messages.json:", error.message);
  }
}

function loadMessages() {
  try {
    if (fs.existsSync(messagesFile)) {
      const data = fs.readFileSync(messagesFile, "utf8");
      const savedMessages = JSON.parse(data);
      messageHistory = savedMessages || {};
      chats.forEach(chat => {
        if (!messageHistory[chat.id]) {
          messageHistory[chat.id] = [];
        }
      });
      saveMessages();
      console.log("Messages loaded from messages.json");
    } else {
      chats.forEach(chat => {
        messageHistory[chat.id] = [];
      });
      saveMessages();
      console.log("messages.json created");
    }
  } catch (error) {
    console.log("Error loading messages.json:", error.message);
  }
}

function isAdminRequest(req) {
  const adminPassword = req.query.admin || (req.body && req.body.admin);
  return adminPassword === "admin123";
}

loadUsers();
loadChats();
loadContacts();
loadMessages();

app.get("/api/users", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "ØºÙŠØ± Ù…ØµØ±Ø­" });
  }

  const users = Object.keys(allowedUsers).map(name => {
    const value = allowedUsers[name];

    if (value && typeof value === "object") {
      return {
        name,
        phone: value.phone || "",
        password: value.password || ""
      };
    }

    return {
      name,
      phone: "",
      password: value || ""
    };
  });

  res.json({ ok: true, users });
});

app.post("/api/users", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "ØºÙŠØ± Ù…ØµØ±Ø­" });
  }

  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();
  const password = String(req.body.password || "").trim();

  if (!name) {
    return res.json({ ok: false, message: "Ø§ÙƒØªØ¨ Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…" });
  }

  if (!phone) {
    return res.json({ ok: false, message: "Ø§ÙƒØªØ¨ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ" });
  }

  if (name !== "Ø£Ø³Ø±" && name !== "Ø§Ø³Ø±" && password.length < 3) {
    return res.json({ ok: false, message: "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù‚ØµÙŠØ±Ø© Ø¬Ø¯Ù‹Ø§" });
  }

  allowedUsers[name] = {
    phone,
    password
  };
  saveUsers();

  res.json({ ok: true, message: "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…" });
});

app.delete("/api/users/:name", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "ØºÙŠØ± Ù…ØµØ±Ø­" });
  }

  const name = decodeURIComponent(req.params.name);

  if (name === "admin") {
    return res.json({ ok: false, message: "Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø­Ø°Ù admin" });
  }

  if (name === "Ø£Ø³Ø±" || name === "Ø§Ø³Ø±") {
    return res.json({ ok: false, message: "Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø­Ø°Ù Ø£Ø³Ø±" });
  }

  delete allowedUsers[name];
  saveUsers();

  res.json({ ok: true, message: "ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…" });
});

app.get("/api/chats-public", (req, res) => {
  res.json({ ok: true, chats });
});

app.get("/api/contacts", (req, res) => {
  const username = String(req.query.username || "").trim();
  if (!username) return res.json({ ok: false, message: "Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø·Ù„ÙˆØ¨" });
  res.json({ ok: true, contacts: contacts[username] || [] });
});

app.post("/api/contacts", (req, res) => {
  const username = String(req.body.username || "").trim();
  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();
  if (!username || !name || !phone) return res.json({ ok: false, message: "Ø§ÙƒØªØ¨ Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙˆØ§Ø³Ù… Ø§Ù„ÙƒÙˆÙ†ØªØ§ÙƒØª ÙˆØ±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ" });
  const foundUser = Object.entries(allowedUsers).find(([savedName, savedValue]) => {
    if (savedValue && typeof savedValue === "object") return String(savedValue.phone || "").trim() === phone;
    return false;
  });
  if (!contacts[username]) contacts[username] = [];
  if (contacts[username].some(c => String(c.phone || "").trim() === phone)) return res.json({ ok: false, message: "Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆÙ†ØªØ§ÙƒØª Ù…ÙˆØ¬ÙˆØ¯ Ø¨Ø§Ù„ÙØ¹Ù„" });
  const contact = {
    name: foundUser ? foundUser[0] : name,
    displayName: name,
    phone,
    registered: !!foundUser
  };
  contacts[username].push(contact);
  saveContacts();
  res.json({ ok: true, contact });
});

app.get("/api/chats", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "ØºÙŠØ± Ù…ØµØ±Ø­" });
  }

  res.json({ ok: true, chats });
});

app.post("/api/chats", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "ØºÙŠØ± Ù…ØµØ±Ø­" });
  }

  const name = String(req.body.name || "").trim();
  const avatar = String(req.body.avatar || "").trim() || "Ø¯";

  if (!name) {
    return res.json({ ok: false, message: "Ø§ÙƒØªØ¨ Ø§Ø³Ù… Ø§Ù„Ø¯Ø±Ø¯Ø´Ø©" });
  }

  const id = "room_" + Date.now();

  const chat = {
    id,
    name,
    avatar: avatar.slice(0, 2)
  };

  chats.push(chat);
  messageHistory[id] = [];

  saveChats();
  saveMessages();

  res.json({ ok: true, message: "ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¯Ø±Ø¯Ø´Ø©", chat });
});

app.delete("/api/chats/:id", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "ØºÙŠØ± Ù…ØµØ±Ø­" });
  }

  const id = decodeURIComponent(req.params.id);

  

  chats = chats.filter(chat => chat.id !== id);
  delete messageHistory[id];

  saveChats();
  saveMessages();

  res.json({ ok: true, message: "ØªÙ… Ø­Ø°Ù Ø§Ù„Ø¯Ø±Ø¯Ø´Ø©" });
});

const onlineUsers = {};

function getOnlineUsersList() {
  return Object.values(onlineUsers);
}

function broadcastOnlineUsers() {
  io.emit("online users", getOnlineUsersList());
}


app.get("/ice-config", (req, res) => {
  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" }
  ];

  const turnUrls = String(process.env.TURN_URLS || "")
    .split(",")
    .map(url => url.trim())
    .filter(Boolean);

  const turnUsername = String(process.env.TURN_USERNAME || "").trim();
  const turnCredential = String(process.env.TURN_CREDENTIAL || "").trim();

  if (turnUrls.length > 0 && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnCredential
    });
  }

  res.json({
    ok: true,
    turnEnabled: turnUrls.length > 0 && !!turnUsername && !!turnCredential,
    iceServers
  });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.isLoggedIn = false;

  socket.on("login", (data, callback) => {
    const name = String(data.name || "").trim();
    const phone = String(data.phone || "").trim();

    if (!name) {
      callback({ ok: false, message: "Ø§ÙƒØªØ¨ Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…" });
      return;
    }

    if (!phone) {
      callback({ ok: false, message: "Ø§ÙƒØªØ¨ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ" });
      return;
    }

    const existingUserByPhone = Object.entries(allowedUsers).find(([existingName, existingValue]) => {
      if (existingValue && typeof existingValue === "object") {
        return String(existingValue.phone || "").trim() === phone;
      }
      return false;
    });

    if (existingUserByPhone) {
      const savedName = existingUserByPhone[0];

      socket.isLoggedIn = true;
      socket.username = savedName;
      socket.phone = phone;

      if (typeof onlineUsers !== "undefined") {
        onlineUsers[socket.id] = { name: socket.username, phone: socket.phone };
        broadcastOnlineUsers();
      }

      callback({ ok: true, name: savedName, phone, newUser: false });
      console.log("Login success by phone without password:", savedName, phone);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(allowedUsers, name)) {
      callback({ ok: false, message: "Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…ÙˆØ¬ÙˆØ¯ Ø¨Ø§Ù„ÙØ¹Ù„ Ù…Ø¹ Ø±Ù‚Ù… Ø¢Ø®Ø±. Ø§Ø®ØªØ± Ø§Ø³Ù…Ø§ Ø¢Ø®Ø± Ø£Ùˆ Ø§Ø¯Ø®Ù„ Ø¨Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø§Ù„Ù‚Ø¯ÙŠÙ…." });
      console.log("Register rejected duplicate name:", name);
      return;
    }

    allowedUsers[name] = {
      phone,
      password: ""
    };

    saveUsers();

    socket.isLoggedIn = true;
    socket.username = name;
    socket.phone = phone;

    if (typeof onlineUsers !== "undefined") {
      onlineUsers[socket.id] = { name: socket.username, phone: socket.phone };
      broadcastOnlineUsers();
    }

    callback({ ok: true, name, phone, newUser: true });
    console.log("New user registered without password:", name, phone);
  });
  socket.on("request online users", () => {
    if (typeof onlineUsers !== "undefined") {
      socket.emit("online users", getOnlineUsersList());
    }
  });

  socket.on("join room", (data) => {
    if (!socket.isLoggedIn) {
      socket.emit("login required", { message: "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ù‹Ø§" });
      return;
    }

    const room = String(data.room || "");

    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
    }

    socket.currentRoom = room;
    socket.join(room);

    if (!messageHistory[room]) {
      messageHistory[room] = [];
      saveMessages();
    }

    socket.emit("room history", {
      room,
      messages: messageHistory[room]
    });

    socket.to(room).emit("system message", {
      text: socket.username + " Ø¯Ø®Ù„ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø©"
    });
  });

  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    broadcastOnlineUsers();
    console.log("User disconnected:", socket.id);
  });

  socket.on("chat message", (data) => {
    if (!socket.isLoggedIn || !socket.currentRoom) return;

    const message = {
      room: socket.currentRoom,
      name: socket.username,
      type: data.type || "text",
      text: data.text || "",
      image: data.image || "",
      audio: data.audio || "",
      time: data.time,
      date: new Date().toISOString()
    };

    if (!messageHistory[socket.currentRoom]) {
      messageHistory[socket.currentRoom] = [];
    }

    messageHistory[socket.currentRoom].push(message);

    if (messageHistory[socket.currentRoom].length > 500) {
      messageHistory[socket.currentRoom].shift();
    }

    saveMessages();

    io.to(socket.currentRoom).emit("chat message", message);
  });

  socket.on("clear room messages", (data) => {
    if (!socket.isLoggedIn || !socket.currentRoom) return;

    const roomToClear = socket.currentRoom;

    if (!messageHistory[roomToClear]) {
      messageHistory[roomToClear] = [];
    }

    messageHistory[roomToClear] = [];
    saveMessages();

    io.to(roomToClear).emit("messages cleared", {
      room: roomToClear
    });
  });
  socket.on("typing", () => {
    if (!socket.isLoggedIn || !socket.currentRoom || !socket.username) return;
    socket.to(socket.currentRoom).emit("typing", socket.username);
  });

  socket.on("stop typing", () => {
    if (!socket.isLoggedIn || !socket.currentRoom) return;
    socket.to(socket.currentRoom).emit("stop typing");
  });


  socket.on("call-offer", (data) => {
    if (!socket.isLoggedIn || !socket.currentRoom || !socket.username) return;
    if (!socket.currentRoom.startsWith("private:")) {
      socket.emit("call-reject", { from: "Local Chat", reason: "Ø§Ù„Ù…ÙƒØ§Ù„Ù…Ø§Øª Ù…ØªØ§Ø­Ø© ÙÙŠ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø§Øª Ø§Ù„Ø®Ø§ØµØ© ÙÙ‚Ø·" });
      return;
    }

    socket.to(socket.currentRoom).emit("call-offer", {
      room: socket.currentRoom,
      from: socket.username,
      type: data.type || "voice",
      offer: data.offer
    });
  });

  socket.on("call-answer", (data) => {
    if (!socket.isLoggedIn || !socket.currentRoom || !socket.username) return;
    if (!socket.currentRoom.startsWith("private:")) return;

    socket.to(socket.currentRoom).emit("call-answer", {
      room: socket.currentRoom,
      from: socket.username,
      answer: data.answer
    });
  });

  socket.on("call-ice-candidate", (data) => {
    if (!socket.isLoggedIn || !socket.currentRoom || !socket.username) return;
    if (!socket.currentRoom.startsWith("private:")) return;

    socket.to(socket.currentRoom).emit("call-ice-candidate", {
      room: socket.currentRoom,
      from: socket.username,
      candidate: data.candidate
    });
  });

  socket.on("call-reject", (data) => {
    if (!socket.isLoggedIn || !socket.currentRoom || !socket.username) return;
    if (!socket.currentRoom.startsWith("private:")) return;

    socket.to(socket.currentRoom).emit("call-reject", {
      room: socket.currentRoom,
      from: socket.username
    });
  });

  socket.on("call-end", (data) => {
    if (!socket.isLoggedIn || !socket.currentRoom || !socket.username) return;
    if (!socket.currentRoom.startsWith("private:")) return;

    socket.to(socket.currentRoom).emit("call-end", {
      room: socket.currentRoom,
      from: socket.username
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000; server.listen(PORT, "0.0.0.0", () => {
  console.log("Local Chat is running on http://localhost:3000");
});













