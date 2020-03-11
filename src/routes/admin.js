const router = require("express").Router();
const Admin = require("../controllers/admin");
const Auth = require("../middleware/index");

// add user

router.post("/addUser", Admin.addUser);

//admin login

router.post("/login/admin", Admin.login);

// update Company share value

router.post(
  "/changeCompanyShareValue",
  Auth.auth.checkToken,
  Admin.updateCompanyShareValue
);

// get user details

router.post("/userDetails", Auth.auth.checkToken, Admin.userDetails);

// update news

router.post("/addNews", Auth.auth.checkToken, Admin.addNews);

module.exports = router;
