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

const messagesFile = path.join(__dirname, "messages.json");
const usersFile = path.join(__dirname, "users.json");
const chatsFile = path.join(__dirname, "chats.json");

let allowedUsers = {
  "أسر": "",
  "اسر": "",
  "محمد": "1234",
  "شادي": "1234",
  "جودي": "1234",
  "عمر": "1234",
  "admin": "admin123"
};

let chats = [
  { id: "family", name: "دردشة العائلة", avatar: "ع" },
  { id: "friends", name: "الأصدقاء", avatar: "ص" },
  { id: "work", name: "العمل", avatar: "ع" }
];

let messageHistory = {
  family: [],
  friends: [],
  work: []
};

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
      allowedUsers["أسر"] = allowedUsers["أسر"] || "";
      allowedUsers["اسر"] = allowedUsers["اسر"] || "";
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
loadMessages();

app.get("/api/users", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "غير مصرح" });
  }

  const users = Object.keys(allowedUsers).map(name => ({
    name,
    password: allowedUsers[name]
  }));

  res.json({ ok: true, users });
});

app.post("/api/users", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "غير مصرح" });
  }

  const name = String(req.body.name || "").trim();
  const password = String(req.body.password || "").trim();

  if (!name) {
    return res.json({ ok: false, message: "اكتب اسم المستخدم" });
  }

  if (name !== "أسر" && name !== "اسر" && password.length < 3) {
    return res.json({ ok: false, message: "كلمة المرور قصيرة جدًا" });
  }

  allowedUsers[name] = password;
  saveUsers();

  res.json({ ok: true, message: "تم حفظ المستخدم" });
});

app.delete("/api/users/:name", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "غير مصرح" });
  }

  const name = decodeURIComponent(req.params.name);

  if (name === "admin") {
    return res.json({ ok: false, message: "لا يمكن حذف admin" });
  }

  if (name === "أسر" || name === "اسر") {
    return res.json({ ok: false, message: "لا يمكن حذف أسر" });
  }

  delete allowedUsers[name];
  saveUsers();

  res.json({ ok: true, message: "تم حذف المستخدم" });
});

app.get("/api/chats-public", (req, res) => {
  res.json({ ok: true, chats });
});

app.get("/api/chats", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "غير مصرح" });
  }

  res.json({ ok: true, chats });
});

app.post("/api/chats", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "غير مصرح" });
  }

  const name = String(req.body.name || "").trim();
  const avatar = String(req.body.avatar || "").trim() || "د";

  if (!name) {
    return res.json({ ok: false, message: "اكتب اسم الدردشة" });
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

  res.json({ ok: true, message: "تمت إضافة الدردشة", chat });
});

app.delete("/api/chats/:id", (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, message: "غير مصرح" });
  }

  const id = decodeURIComponent(req.params.id);

  if (id === "family") {
    return res.json({ ok: false, message: "لا يمكن حذف دردشة العائلة الأساسية" });
  }

  chats = chats.filter(chat => chat.id !== id);
  delete messageHistory[id];

  saveChats();
  saveMessages();

  res.json({ ok: true, message: "تم حذف الدردشة" });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.isLoggedIn = false;

  socket.on("login", (data, callback) => {
    const name = String(data.name || "").trim();
    const password = String(data.password || "").trim();
    const canLoginWithoutPin = name === "أسر" || name === "اسر";

    if (!name) {
      callback({ ok: false, message: "اكتب اسم المستخدم" });
      return;
    }

    if (!canLoginWithoutPin && !password) {
      callback({ ok: false, message: "اكتب كلمة المرور" });
      return;
    }

    if (!canLoginWithoutPin && password.length < 3) {
      callback({ ok: false, message: "كلمة المرور يجب أن تكون 3 أحرف أو أرقام على الأقل" });
      return;
    }

    if (allowedUsers[name]) {
      if (!canLoginWithoutPin && allowedUsers[name] !== password) {
        callback({ ok: false, message: "كلمة المرور غير صحيحة" });
        console.log("Login failed wrong password:", name);
        return;
      }

      socket.isLoggedIn = true;
      socket.username = name;
      callback({ ok: true, name, newUser: false });
      console.log("Login success:", name);
      return;
    }

    allowedUsers[name] = canLoginWithoutPin ? "" : password;
    saveUsers();

    socket.isLoggedIn = true;
    socket.username = name;
    callback({ ok: true, name, newUser: true });
    console.log("New user registered:", name);
  });

  socket.on("join room", (data) => {
    if (!socket.isLoggedIn) {
      socket.emit("login required", { message: "يجب تسجيل الدخول أولًا" });
      return;
    }

    const room = String(data.room || "family");

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
      text: socket.username + " دخل المحادثة"
    });
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

  socket.on("typing", () => {
    if (!socket.isLoggedIn || !socket.currentRoom || !socket.username) return;
    socket.to(socket.currentRoom).emit("typing", socket.username);
  });

  socket.on("stop typing", () => {
    if (!socket.isLoggedIn || !socket.currentRoom) return;
    socket.to(socket.currentRoom).emit("stop typing");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Local Chat is running on http://localhost:3000");
});

