"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/verify', authController_1.verifyProof);
router.post('/test-proof', authController_1.generateTestProof);
router.get('/status', authController_1.getStatus);
router.get('/me', auth_1.authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user,
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map