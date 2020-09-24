const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
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
io.on("connection", (socket) => {
  console.log(socket.handshake.address + " Connected");
  socket.on("user", async (data) => {
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
  exposedHeaders: "x-access-token",
};

app.use(helmet());
app.use(cors(corsOption));

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);
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
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.log("Error Connecting Database");
      console.log(err);
      process.exit(1);
    }
    console.log("DB Connected");
  }
);
app.use("/user", routes.user);
app.use("/admin", routes.admin);
app.use("/broker", routes.broker);
app.get("/", (req, res) => {
  res.redirect("https://www.linkedin.com/in/meet-usadadiya-850035165/");
});
app.post("/", (req, res) => {
  res.redirect("https://www.linkedin.com/in/meet-usadadiya-850035165/");
});
app.get("*", (req, res) => {
  res.redirect("https://www.linkedin.com/in/meet-usadadiya-850035165/");
});
app.post("*", (req, res) => {
  res.redirect("https://www.linkedin.com/in/meet-usadadiya-850035165/");
});

// let port1 = process.env.PORT || 3001;
let port2 = process.env.PORT || 4001;

// app.listen(port1, "localhost", err => {
//   if (err) console.log("Error listening on the port: ", err);
// });

server.listen(port2, () => console.log(`Listening on port ${port2}`));
