import express from "express";
import {
  checkInMood,
  completeCozySession,
  completeJoy,
  completeRescue,
  getChillProfile,
  popStress,
  updatePet,
} from "../controllers/chillController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/profile", getChillProfile);
router.post("/mood", checkInMood);
router.post("/joy", completeJoy);
router.post("/stress", popStress);
router.post("/cozy", completeCozySession);
router.post("/pet", updatePet);
router.post("/rescue", completeRescue);

export default router;
