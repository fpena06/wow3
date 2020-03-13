const express = require("express");
const User = require("../controllers/user");
const Auth = require("../middleware/index");
let router = express.Router();
// login user

router.post("/login/user", User.login);

//change password

router.post("/changePassword", Auth.auth.checkToken, User.changePassword);

// user dashboard

router.post("/dashboard/stat", Auth.auth.checkToken, User.dashboard);

// stock bar

router.post("/stockbar", Auth.auth.checkToken, User.stockbar);

// user dashboard after selecting category

router.post(
  "/dashboard/category",
  Auth.auth.checkToken,
  User.dashboardCategory
);

//  get category

router.post("/category", User.category);

// news section

router.post("/news", Auth.auth.checkToken, User.newsDisplay);

//user leaderboard

router.post("/leaderboard", Auth.auth.checkToken, User.leaderboard);

// transaction

router.post("/transaction", Auth.auth.checkToken, User.transaction);

// buying shares

router.post("/company/buyShares", Auth.auth.checkToken, User.buyShares);

//selling shares

router.post("/company/sellShares", Auth.auth.checkToken, User.sellShares);

// add company to watchList

router.post("/addToWatchlist", Auth.auth.checkToken, User.addToWatchlist);

// remove from watchlist

router.post(
  "/deleteFromWatchlist",
  Auth.auth.checkToken,
  User.removeFromWatchlist
);

// display watchlist

router.post("/watchlist", Auth.auth.checkToken, User.watchlist);

// get end time

router.post("/getEndTime", Auth.auth.checkToken, User.time);

module.exports = router;
