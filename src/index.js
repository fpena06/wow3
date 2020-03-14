const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const routes = require("./routes");
const config = require("config");
const app = express();
const socketIo = require("socket.io");
const http = require("http");
const cors = require("cors");

// Socket

const server = http.createServer(app);
const io = socketIo(server, { transport: ["websocket"] });
io.origins("*:*");
io.on("connection", socket => {
  console.log(socket.handshake.address + " Connected");
  socket.on("user", async data => {
    console.log("shreeji sent", data);
    const user = await require("../src/controllers/user").dashboardSocket(data);
    console.log(user);
    io.emit("user", user);
  });
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// Express

const corsOption = {
  origin: true,
  credentials: true,
  exposedHeaders: "x-access-token"
};
app.use(cors(corsOption));

app.use((req, res, next) => {
  res.io = io;
  next();
});

app.disable("x-powered-by");

app.use(express.json());

mongoose.connect(
  config.get("DBURL"),
  {
    useFindAndModify: false,
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  err => {
    if (err) {
      console.log("Error Connecting Database");
      console.log(err);
      process.exit(1);
    }
    console.log("DB Connected");
  }
);
app.get("/", (req, res) => {
  res.send({ message: config.get("DBURL") });
});
app.use("/user", routes.user);
app.use("/admin", routes.admin);
app.use("/broker", routes.broker);

// let port1 = process.env.PORT || 3001;
let port2 = process.env.PORT || 4001;

// app.listen(port1, "localhost", err => {
//   if (err) console.log("Error listening on the port: ", err);
// });

server.listen(port2, () => console.log(`Listening on port ${port2}`));
