const router = require("express").Router();
const Admin = require("../controllers/admin");
const Auth = require("../middleware/index");

//add admin

router.post("/addAdmin", Auth.auth.checkToken, Admin.addAdmin);

// add user

router.post("/addUser", Auth.auth.checkToken, Admin.addUser);

//admin login

router.post("/login/admin", Admin.login);

// admin dashboard

router.post("/dashboard", Auth.auth.checkToken, Admin.dashboard);

// admin dashboard

router.post(
  "/dashboardCategory",
  Auth.auth.checkToken,
  Admin.dashboardCategory
);

// add company

router.post("/addCompany", Auth.auth.checkToken, Admin.addCompany);

// update Company share value

router.post(
  "/changeCompanyShareValue",
  Auth.auth.checkToken,
  Admin.updateCompanyShareValue
);

// get company

router.post("/company", Auth.auth.checkToken, Admin.company);

// get user details

router.post("/userDetails", Auth.auth.checkToken, Admin.userDetails);

// update news

router.post("/addNews", Auth.auth.checkToken, Admin.addNews);

// news section

router.post("/news", Auth.auth.checkToken, Admin.newsDisplay);

//user leaderboard

router.post("/leaderboard", Auth.auth.checkToken, Admin.leaderboard);

//user transaction

router.post("/transaction", Auth.auth.checkToken, Admin.transaction);

//

module.exports = router;
