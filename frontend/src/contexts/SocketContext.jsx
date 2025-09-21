import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth0 } from '@auth0/auth0-react';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map()); // conversationId -> Set of userIds
  const { user, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: {
          token: 'temp-token', // Replace with actual Auth0 token
          userId: user.sub // Use Auth0 user ID
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      // Handle online/offline status
      newSocket.on('user:online', ({ userId }) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on('user:offline', ({ userId }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      // Handle typing indicators
      newSocket.on('user:typing', ({ conversationId, userId }) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (!newMap.has(conversationId)) {
            newMap.set(conversationId, new Set());
          }
          newMap.get(conversationId).add(userId);
          return newMap;
        });
      });

      newSocket.on('user:stopTyping', ({ conversationId, userId }) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (newMap.has(conversationId)) {
            newMap.get(conversationId).delete(userId);
            if (newMap.get(conversationId).size === 0) {
              newMap.delete(conversationId);
            }
          }
          return newMap;
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  // Socket helper functions
  const joinConversation = (conversationId) => {
    if (socket) {
      socket.emit('conversation:join', conversationId);
    }
  };

  const sendMessage = (conversationId, content, type = 'text', attachments = []) => {
    if (socket) {
      socket.emit('message:send', {
        conversationId,
        content,
        type,
        attachments
      });
    }
  };

  const editMessage = (messageId, content) => {
    if (socket) {
      socket.emit('message:edit', { messageId, content });
    }
  };

  const deleteMessage = (messageId) => {
    if (socket) {
      socket.emit('message:delete', { messageId });
    }
  };

  const startTyping = (conversationId) => {
    if (socket) {
      socket.emit('typing:start', { conversationId });
    }
  };

  const stopTyping = (conversationId) => {
    if (socket) {
      socket.emit('typing:stop', { conversationId });
    }
  };

  const createGroup = (name, description, participantIds) => {
    if (socket) {
      socket.emit('group:create', {
        name,
        description,
        participantIds
      });
    }
  };

  const addParticipants = (conversationId, userIds) => {
    if (socket) {
      socket.emit('group:addParticipants', {
        conversationId,
        userIds
      });
    }
  };

  const leaveGroup = (conversationId) => {
    if (socket) {
      socket.emit('group:leave', { conversationId });
    }
  };

  const markMessagesAsRead = (conversationId, messageIds) => {
    if (socket) {
      socket.emit('messages:markRead', {
        conversationId,
        messageIds
      });
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    // Socket event helpers
    joinConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    createGroup,
    addParticipants,
    leaveGroup,
    markMessagesAsRead
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};