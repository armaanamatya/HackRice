import React, { useState, useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { useSocket } from '../../contexts/SocketContext';
import MessageInput from './MessageInput';
import './ChatWindow.css';

const ChatWindow = ({ conversation, messages, currentUserId }) => {
  const [editingMessage, setEditingMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const { 
    sendMessage, 
    editMessage, 
    deleteMessage, 
    markMessagesAsRead,
    typingUsers,
    onlineUsers
  } = useSocket();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when viewing conversation
    if (messages.length > 0) {
      const unreadMessages = messages
        .filter(msg => !msg.readBy.some(r => r.user === currentUserId))
        .map(msg => msg._id);
      
      if (unreadMessages.length > 0) {
        markMessagesAsRead(conversation._id, unreadMessages);
      }
    }
  }, [messages, conversation._id, currentUserId, markMessagesAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (content, type = 'text', attachments = []) => {
    sendMessage(conversation._id, content, type, attachments);
  };

  const handleEditMessage = (messageId, content) => {
    editMessage(messageId, content);
    setEditingMessage(null);
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId);
    }
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'HH:mm')}`;
    } else {
      return format(messageDate, 'dd/MM/yyyy HH:mm');
    }
  };

  const getConversationTitle = () => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
      return otherParticipant?.name || 'Unknown User';
    }
    return conversation.name;
  };

  const getOnlineStatus = () => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
      return otherParticipant && onlineUsers.has(otherParticipant._id);
    }
    return null;
  };

  const getTypingIndicator = () => {
    const typingInConv = typingUsers.get(conversation._id);
    if (typingInConv && typingInConv.size > 0) {
      const typingUserIds = Array.from(typingInConv).filter(id => id !== currentUserId);
      if (typingUserIds.length > 0) {
        const typingNames = typingUserIds.map(id => {
          const user = conversation.participants.find(p => p._id === id);
          return user?.name || 'Someone';
        });
        
        if (typingNames.length === 1) {
          return `${typingNames[0]} is typing...`;
        } else if (typingNames.length === 2) {
          return `${typingNames[0]} and ${typingNames[1]} are typing...`;
        } else {
          return `${typingNames.length} people are typing...`;
        }
      }
    }
    return null;
  };

  const shouldShowAvatar = (message, index) => {
    if (index === messages.length - 1) return true;
    const nextMessage = messages[index + 1];
    return nextMessage.sender._id !== message.sender._id;
  };

  const shouldShowTimestamp = (message, index) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const timeDiff = new Date(message.createdAt) - new Date(prevMessage.createdAt);
    return timeDiff > 5 * 60 * 1000; // 5 minutes
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentGroup = null;
    
    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt);
      const dateStr = format(messageDate, 'yyyy-MM-dd');
      
      if (!currentGroup || currentGroup.date !== dateStr) {
        currentGroup = { date: dateStr, messages: [] };
        groups.push(currentGroup);
      }
      
      currentGroup.messages.push({ ...message, index });
    });
    
    return groups;
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM dd, yyyy');
    }
  };

  const isOnline = getOnlineStatus();
  const typingIndicator = getTypingIndicator();
  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="conversation-info">
          <h3>{getConversationTitle()}</h3>
          {conversation.type === 'direct' && (
            <span className={`status ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          )}
          {conversation.type === 'group' && (
            <span className="participant-count">
              {conversation.participants.length} members
            </span>
          )}
        </div>
        
        <div className="chat-actions">
          {conversation.type === 'group' && (
            <button className="btn-icon" title="Group settings">
              <i className="icon-settings"></i>
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messageGroups.map((group) => (
          <div key={group.date} className="message-group">
            <div className="date-separator">
              <span>{formatDateHeader(group.date)}</span>
            </div>
            
            {group.messages.map((message) => {
              const isOwnMessage = message.sender._id === currentUserId;
              const showAvatar = shouldShowAvatar(message, message.index);
              const showTimestamp = shouldShowTimestamp(message, message.index);
              
              return (
                <div key={message._id} className="message-wrapper">
                  {showTimestamp && (
                    <div className="timestamp-separator">
                      {formatMessageTime(message.createdAt)}
                    </div>
                  )}
                  
                  <div className={`message ${isOwnMessage ? 'own' : 'other'}`}>
                    {!isOwnMessage && showAvatar && (
                      <div className="message-avatar">
                        {message.sender.profilePicture ? (
                          <img 
                            src={message.sender.profilePicture} 
                            alt={message.sender.name}
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {message.sender.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="message-content">
                      {!isOwnMessage && conversation.type !== 'direct' && showAvatar && (
                        <div className="message-sender">{message.sender.name}</div>
                      )}
                      
                      {editingMessage === message._id ? (
                        <MessageEditor
                          message={message}
                          onSave={(content) => handleEditMessage(message._id, content)}
                          onCancel={() => setEditingMessage(null)}
                        />
                      ) : (
                        <div className="message-text">
                          {message.content}
                          {message.isEdited && (
                            <span className="edited-indicator">(edited)</span>
                          )}
                        </div>
                      )}
                      
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="message-attachments">
                          {message.attachments.map((attachment, index) => (
                            <div key={index} className="attachment">
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                📎 {attachment.filename}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {isOwnMessage && (
                      <div className="message-actions">
                        <button 
                          className="btn-icon"
                          onClick={() => setEditingMessage(message._id)}
                          title="Edit message"
                        >
                          <i className="icon-edit"></i>
                        </button>
                        <button 
                          className="btn-icon"
                          onClick={() => handleDeleteMessage(message._id)}
                          title="Delete message"
                        >
                          <i className="icon-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {typingIndicator && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">{typingIndicator}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage}
        conversationId={conversation._id}
        placeholder={`Message ${getConversationTitle()}...`}
      />
    </div>
  );
};

// Message Editor Component
const MessageEditor = ({ message, onSave, onCancel }) => {
  const [content, setContent] = useState(message.content);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim() && content.trim() !== message.content) {
      onSave(content.trim());
    } else {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-editor">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus
        onBlur={onCancel}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onCancel();
          }
        }}
      />
    </form>
  );
};

export default ChatWindow;