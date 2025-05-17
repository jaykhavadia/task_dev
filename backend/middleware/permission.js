const Note = require("../models/Note");

const checkPermission = async (req, res, next) => {
  const userId = req.user.userId;
  const noteId = req.params.id;

  try {
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const isOwner = note.createdBy.toString() === userId;
    const isCollaboratorWithWriteAccess = note.collaborators.some(
      (collab) =>
        collab.userId.toString() === userId && collab.permission === "write"
    );

    if (!isOwner && !isCollaboratorWithWriteAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Attach note to request for downstream use if needed
    req.note = note;
    next();
  } catch (error) {
    console.error("[Permission Middleware] Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = checkPermission;
