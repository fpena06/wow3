const router = require("express").Router();
const Admin = require("../controllers/admin");

router.post("/login/admin", Admin.login);
router.get("/dashboard", Admin.dashboard);
router.post("/dashboard", Admin.user);
module.exports = router;
