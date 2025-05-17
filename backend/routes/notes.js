const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  shareNote,
} = require("../controllers/noteController");
const checkPermission = require("../middleware/permission");

router.use(auth);

// @route GET /api/notes
router.get("/", getNotes);

// @route POST /api/notes
router.post("/", createNote);

// @route PUT /api/notes/:id
router.put("/:id", checkPermission, updateNote);

// @route DELETE /api/notes/:id
router.delete("/:id", checkPermission, deleteNote);

// @route PUT /api/notes/:id/share
router.put("/:id/share", checkPermission, shareNote);

module.exports = router;
