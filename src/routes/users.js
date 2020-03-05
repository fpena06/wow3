const express = require('express');
const User = require('../controllers/user');
const Auth = require('../middleware/index');
let router = express.Router();

// add user

router.post('/addUser', User.addUser);

// login user

router.post('/login/user', User.login);

//change password

router.post('/changePassword', Auth.auth.checkToken, User.changePassword);

// user dashboard

router.get('/dashboard', User.dashboard);

// user dashboard after selecting category

router.get(
  '/dashboard/:category',
  Auth.auth.checkToken,
  User.dashboardCategory
);

// asdfghjkl
router.get('/asdf', (req, res) => {
  res.io.emit('outgoing data', { num: 98 });
});
//user leaderboard

router.get('/leaderboard', Auth.auth.checkToken, User.leaderboard);

// transaction

router.post('/transaction', Auth.auth.checkToken, User.transaction);

// buying shares

router.post('/company/buyShares', Auth.auth.checkToken, User.buyShares);

//selling shares

router.post('/company/sellShares', Auth.auth.checkToken, User.sellShares);

module.exports = router;
