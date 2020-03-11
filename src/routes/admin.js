const router = require("express").Router();
const Admin = require("../controllers/admin");

// router.post("/login/admin", Admin.login);
router.post(
  "/dashboard/changeCompanyShareValue",
  Admin.updateCompanyShareValue
);
// router.post("/dashboard", Admin.user);
module.exports = router;
