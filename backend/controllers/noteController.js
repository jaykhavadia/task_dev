const logger = require('../utils/logger');
const Note = require("../models/Note");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Helper to emit events excluding the updater
const emitToCollaborators = (note, event, data, excludeUserId) => {
  const collaborators = note.collaborators.map((c) => c.userId.toString());
  collaborators.forEach((userId) => {
    if (userId !== excludeUserId) {
      global.io.to(userId).emit(event, data);
      logger.info(`Emitted event '${event}' to user ${userId} excluding ${excludeUserId}`);
    }
  });
  // Also emit to owner if not excluded
  if (note.createdBy.toString() !== excludeUserId) {
    global.io.to(note.createdBy.toString()).emit(event, data);
    logger.info(`Emitted event '${event}' to owner ${note.createdBy.toString()} excluding ${excludeUserId}`);
  }
};

// Create
exports.createNote = async (req, res) => {
  logger.info(`CreateNote called by user ${req.user.userId} with body: ${JSON.stringify(req.body)}`);
  try {
    const { title, content } = req.body;
    const note = await Note.create({
      title,
      content,
      createdBy: req.user.userId,
    });
    global.io.to(req.user.userId).emit("note:created", note);
    logger.info(`Note created with id ${note._id} by user ${req.user.userId}`);
    res.status(201).json(note);
  } catch (err) {
    logger.error("[Create Note Error] %s", err.stack);
    res.status(500).json({ message: "Error creating note" });
  }
};

// Get all notes user can access with pagination and sorting
exports.getNotes = async (req, res) => {
  logger.info(`GetNotes called by user ${req.user.userId} with query: ${JSON.stringify(req.query)}`);
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notes = await Note.find({
      $or: [
        { createdBy: userId },
        { "collaborators.userId": userId },
      ],
      isArchived: false,
    })
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email");

    const total = await Note.countDocuments({
      $or: [
        { createdBy: userId },
        { "collaborators.userId": userId },
      ],
      isArchived: false,
    });

    logger.info(`Found ${notes.length} notes for user ${userId} on page ${page}`);
    res.json({
      notes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error("[Get Notes Error] %s", err.stack);
    res.status(500).json({ message: "Error fetching notes" });
  }
};

// Update
exports.updateNote = async (req, res) => {
  logger.info(`UpdateNote called by user ${req.user.userId} for note ${req.params.id} with body: ${JSON.stringify(req.body)}`);
  try {
    const note = await Note.findById(req.params.id);
    const userId = req.user.userId;

    if (!note) {
      logger.warn(`Note ${req.params.id} not found for update by user ${userId}`);
      return res.status(404).json({ message: "Note not found" });
    }

    const isOwner = note.createdBy.equals(userId);
    const hasWrite = note.collaborators.some(
      (c) => c.userId.equals(userId) && c.permission === "write"
    );

    if (!isOwner && !hasWrite) {
      logger.warn(`User ${userId} forbidden to update note ${req.params.id}`);
      return res.status(403).json({ message: "Forbidden" });
    }

    note.title = req.body.title || note.title;
    note.content = req.body.content || note.content;
    note.lastUpdated = new Date();
    await note.save();

    // Emit real-time update excluding updater
    emitToCollaborators(note, "note:updated", note, userId);
    logger.info(`Note ${req.params.id} updated by user ${userId}`);

    res.json(note);
  } catch (err) {
    logger.error("[Update Note Error] %s", err.stack);
    res.status(500).json({ message: "Error updating note" });
  }
};

// Delete (Only owner)
exports.deleteNote = async (req, res) => {
  logger.info(`DeleteNote called by user ${req.user.userId} for note ${req.params.id}`);
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      logger.warn(`Note ${req.params.id} not found for delete by user ${req.user.userId}`);
      return res.status(404).json({ message: "Note not found" });
    }

    if (!note.createdBy.equals(req.user.userId)) {
      logger.warn(`User ${req.user.userId} forbidden to delete note ${req.params.id}`);
      return res.status(403).json({ message: "Only owner can delete" });
    }

    await note.deleteOne();

    // Emit real-time delete excluding updater
    emitToCollaborators(note, "note:deleted", note._id, req.user.userId);
    logger.info(`Note ${req.params.id} deleted by user ${req.user.userId}`);

    res.json({ message: "Note deleted" });
  } catch (err) {
    logger.error("[Delete Note Error] %s", err.stack);
    res.status(500).json({ message: "Error deleting note" });
  }
};

// Share
exports.shareNote = async (req, res) => {
  logger.info(`ShareNote called by user ${req.user.userId} for note ${req.params.id} with body: ${JSON.stringify(req.body)}`);
  try {
    const { email, permission } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) {
      logger.warn(`Note ${req.params.id} not found for share by user ${req.user.userId}`);
      return res.status(404).json({ message: "Note not found" });
    }

    if (!note.createdBy.equals(req.user.userId)) {
      logger.warn(`User ${req.user.userId} forbidden to share note ${req.params.id}`);
      return res.status(403).json({ message: "Only owner can share" });
    }

    if (!['read', 'write'].includes(permission)) {
      logger.warn(`Invalid permission '${permission}' by user ${req.user.userId} for note ${req.params.id}`);
      return res.status(400).json({ message: "Invalid permission" });
    }

    const userToShare = await User.findOne({ email });
    if (!userToShare) {
      logger.warn(`User to share with email '${email}' not found by user ${req.user.userId}`);
      return res.status(404).json({ message: "User to share with not found" });
    }

    const alreadyShared = note.collaborators.find((c) =>
      c.userId.equals(userToShare._id)
    );
    if (alreadyShared) {
      alreadyShared.permission = permission;
      logger.info(`Updated share permission for user ${userToShare._id} on note ${req.params.id}`);
    } else {
      note.collaborators.push({ userId: userToShare._id, permission });
      logger.info(`Added share permission for user ${userToShare._id} on note ${req.params.id}`);
    }

    await note.save();

    // Emit real-time share excluding updater
    emitToCollaborators(note, "note:shared", note, req.user.userId);
    logger.info(`Note ${req.params.id} shared by user ${req.user.userId}`);

    // Log notification
    const notification = new Notification({
      userId: userToShare._id,
      noteId: note._id,
      message: `Note '${note.title}' was shared with you by ${req.user.userId}`,
    });
    await notification.save();

    res.json(note);
  } catch (err) {
    logger.error("[Share Note Error] %s", err.stack);
    res.status(500).json({ message: "Error sharing note" });
  }
};
