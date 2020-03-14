const router = require("express").Router();
const Broker = require("../controllers/broker");
const Auth = require("../middleware/index");

// add broker

router.post("/addBroker", Broker.addBroker);

// broker login

router.post("/login", Broker.login);

// tip provide

router.post("/brokerTip", Auth.auth.addBroker, Broker.brokerTip);
