const router = require("express").Router();
const Admin = require("../controllers/admin");
const Auth = require("../middleware/index");

//add admin

router.post("/addAdmin", Admin.addAdmin);

// add user

router.post("/addUser", Admin.addUser);

//admin login

router.post("/login/admin", Admin.login);

// add company

router.post("/addCompany", Auth.auth.checkToken, Admin.addCompany);

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

//user leaderboard

router.post("/leaderboard", Auth.auth.checkToken, Admin.leaderboard);

//user transaction

router.post("/transaction", Auth.auth.checkToken, Admin.transaction);

module.exports = router;
