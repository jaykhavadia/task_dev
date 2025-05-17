import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { apiFetch } from '../api/apiClient';
import { SocketContext } from './SocketContext';

export const NotesContext = createContext();

export function NotesProvider({ children }) {
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const [myNotes, setMyNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);

const fetchNotes = async (page = 1, limit = 10, search = '') => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit, search });
    const data = await apiFetch(`/notes?${params.toString()}`);
    // Separate notes into owned and shared based on createdBy and collaborators
    const owned = [];
    const shared = [];
    data.notes.forEach((note) => {
      // Rename label to title for consistency
      const normalizedNote = {
        ...note,
        title: note.label || note.title,
        id: note._id || note.id,
      };

      // Normalize IDs to strings for comparison
      const noteCreatorId = typeof note.createdBy === 'string' ? note.createdBy : (note.createdBy._id || note.createdBy.id);
      const userId = user?._id || user?.id;

      if (String(noteCreatorId) === String(userId)) {
        owned.push(normalizedNote);
      } else {
        shared.push(normalizedNote);
      }
    });
    setMyNotes(owned);
    setSharedNotes(shared);
    setPagination({ page: data.page, limit: data.limit, total: data.total });
    setLoading(false);
  };

  useEffect(() => {
    if (!socket) return;
    socket.on('note:updated', (updatedNote) => {
      console.log('Socket event: note:updated', updatedNote);
      setMyNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === updatedNote.id ? updatedNote : note))
      );
      setSharedNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === updatedNote.id ? updatedNote : note))
      );
    });

    socket.on('note:deleted', (deletedNoteId) => {
      console.log('Socket event: note:deleted', deletedNoteId);
      setMyNotes((prevNotes) => prevNotes.filter((note) => note.id !== deletedNoteId));
      setSharedNotes((prevNotes) => prevNotes.filter((note) => note.id !== deletedNoteId));
    });

    socket.on('note:created', (newNote) => {
      console.log('Socket event: note:created', newNote);
      if (newNote.createdBy === user._id) {
        setMyNotes((prevNotes) => [newNote, ...prevNotes]);
      } else {
        setSharedNotes((prevNotes) => [newNote, ...prevNotes]);
      }
      // Add notification for new note
      setNotifications((prev) => [
        ...prev,
        { id: newNote.id, message: `New note created: ${newNote.title}` },
      ]);
    });

    socket.on('note:shared', (sharedNote) => {
      console.log('Socket event: note:shared', sharedNote);
      if (sharedNote.createdBy === user._id) {
        setMyNotes((prevNotes) => {
          const exists = prevNotes.some((note) => note.id === sharedNote.id);
          if (exists) {
            return prevNotes.map((note) => (note.id === sharedNote.id ? sharedNote : note));
          } else {
            return [sharedNote, ...prevNotes];
          }
        });
      } else {
        setSharedNotes((prevNotes) => {
          const exists = prevNotes.some((note) => note.id === sharedNote.id);
          if (exists) {
            return prevNotes.map((note) => (note.id === sharedNote.id ? sharedNote : note));
          } else {
            return [sharedNote, ...prevNotes];
          }
        });
      }
      // Add notification for shared note
      setNotifications((prev) => [
        ...prev,
        { id: sharedNote.id, message: `Note shared with you: ${sharedNote.title}` },
      ]);
    });

    return () => {
      socket.off('note:updated');
      socket.off('note:deleted');
      socket.off('note:created');
      socket.off('note:shared');
    };
  }, [socket, user]);

  useEffect(() => {
    if (user) {
      fetchNotes(pagination.page, pagination.limit, searchTerm);
    } else {
      setMyNotes([]);
      setSharedNotes([]);
      setNotifications([]);
    }
  }, [user, pagination.page, pagination.limit, searchTerm]);

  const createNote = async (note) => {
    await apiFetch('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
    fetchNotes(pagination.page, pagination.limit, searchTerm);
  };

  const updateNote = async (id, updatedFields) => {
    await apiFetch(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields),
    });
    fetchNotes(pagination.page, pagination.limit, searchTerm);
  };

  const deleteNote = async (id) => {
    await apiFetch(`/notes/${id}`, { method: 'DELETE' });
    fetchNotes(pagination.page, pagination.limit, searchTerm);
  };

  const shareNote = async (id, email, permission) => {
    await apiFetch(`/notes/${id}/share`, {
      method: 'PUT',
      body: JSON.stringify({ email, permission }),
    });
    fetchNotes(pagination.page, pagination.limit, searchTerm);
  };

  return (
    <NotesContext.Provider
      value={{
        myNotes,
        sharedNotes,
        loading,
        pagination,
        searchTerm,
        setSearchTerm,
        setPagination,
        createNote,
        updateNote,
        deleteNote,
        shareNote,
        fetchNotes,
        notifications,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}
