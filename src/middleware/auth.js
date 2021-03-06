let jwt = require("jsonwebtoken");
const config = require("config");
exports.checkToken = async (req, res, next) => {
  try {
    let token = req.headers["x-access-token"] || req.headers["authorization"]; // Express headers are auto converted to lowercase
    if (token) {
      jwt.verify(token, config.get("TOKEN"), (err, decoded) => {
        if (err) {
          return res.json({
            success: false,
            message: "Token is not valid",
          });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      return res.json({
        success: false,
        message: "Auth token is not supplied",
      });
    }
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};

exports.checkToken2 = async (req, res, next) => {
  try {
    let token = req.headers["x-access-token"] || req.headers["authorization"]; // Express headers are auto converted to lowercase
    if (token) {
      jwt.verify(token, config.get("TOKEN2"), (err, decoded) => {
        if (err) {
          return res.json({
            success: false,
            message: "Token is not valid",
          });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      return res.json({
        success: false,
        message: "Auth token is not supplied",
      });
    }
  } catch (ex) {
    console.log(ex);
    res.send({ message: "Internal Server Error" });
  }
};
