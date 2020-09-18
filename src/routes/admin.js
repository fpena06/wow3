const router = require("express").Router();
const Admin = require("../controllers/admin");
const Auth = require("../middleware/index");

//add admin

router.post("/addAdmin", Auth.auth.checkToken2, Admin.addAdmin);

// add user

router.post("/addUser", Auth.auth.checkToken2, Admin.addUser);

//admin login

router.post("/login/admin", Admin.login);

// admin dashboard

router.post("/dashboard", Auth.auth.checkToken2, Admin.dashboard);

// admin dashboard

router.post(
  "/dashboardCategory",
  Auth.auth.checkToken2,
  Admin.dashboardCategory
);

// add company

router.post("/addCompany", Auth.auth.checkToken2, Admin.addCompany);

// update Company share value

router.post(
  "/changeCompanyShareValue",
  Auth.auth.checkToken2,
  Admin.updateCompanyShareValue
);

// get company

router.post("/company", Auth.auth.checkToken2, Admin.company);

// get user details

router.post("/userDetails", Auth.auth.checkToken2, Admin.userDetails);

// update news

router.post("/addNews", Auth.auth.checkToken2, Admin.addNews);

// news section

router.post("/news", Auth.auth.checkToken2, Admin.newsDisplay);

//user leaderboard

router.post("/leaderboard", Auth.auth.checkToken2, Admin.leaderboard);

//user transaction

router.post("/transaction", Auth.auth.checkToken2, Admin.transaction);

//

module.exports = router;
