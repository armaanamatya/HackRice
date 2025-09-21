import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { useSocket } from '../../contexts/SocketContext';
import './ConversationList.css';

const ConversationList = ({ conversations, selectedConversation, onConversationSelect, currentUserId }) => {
  const { onlineUsers, typingUsers } = useSocket();

  const formatLastActivity = (date) => {
    const activityDate = new Date(date);
    if (isToday(activityDate)) {
      return format(activityDate, 'HH:mm');
    } else if (isYesterday(activityDate)) {
      return 'Yesterday';
    } else {
      return format(activityDate, 'dd/MM/yyyy');
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
      return otherParticipant?.name || 'Unknown User';
    }
    return conversation.name;
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
      return otherParticipant?.profilePicture || null;
    }
    return conversation.avatar;
  };

  const isUserOnline = (conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
      return otherParticipant && onlineUsers.has(otherParticipant._id);
    }
    return false;
  };

  const getTypingIndicator = (conversation) => {
    const typingInConv = typingUsers.get(conversation._id);
    if (typingInConv && typingInConv.size > 0) {
      const typingUserIds = Array.from(typingInConv).filter(id => id !== currentUserId);
      if (typingUserIds.length > 0) {
        if (conversation.type === 'direct') {
          return 'typing...';
        } else {
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
    }
    return null;
  };

  const getLastMessagePreview = (conversation) => {
    const typingIndicator = getTypingIndicator(conversation);
    if (typingIndicator) {
      return typingIndicator;
    }

    if (conversation.lastMessage) {
      const message = conversation.lastMessage;
      const senderName = message.sender?.name || 'Unknown';
      const isCurrentUser = message.sender?._id === currentUserId;
      
      let preview = '';
      if (conversation.type !== 'direct') {
        preview = isCurrentUser ? 'You: ' : `${senderName}: `;
      }
      
      if (message.type === 'text') {
        preview += message.content;
      } else if (message.type === 'image') {
        preview += '📷 Image';
      } else if (message.type === 'file') {
        preview += '📎 File';
      }
      
      return preview.length > 50 ? preview.substring(0, 50) + '...' : preview;
    }
    
    return 'Start a conversation...';
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    return new Date(b.lastActivity) - new Date(a.lastActivity);
  });

  return (
    <div className="conversation-list">
      {sortedConversations.length === 0 ? (
        <div className="empty-conversations">
          <p>No conversations yet</p>
          <small>Start a new conversation to get started</small>
        </div>
      ) : (
        sortedConversations.map((conversation) => {
          const isSelected = selectedConversation?._id === conversation._id;
          const isOnline = isUserOnline(conversation);
          const hasUnread = conversation.unreadCount > 0;
          
          return (
            <div
              key={conversation._id}
              className={`conversation-item ${isSelected ? 'selected' : ''} ${hasUnread ? 'unread' : ''}`}
              onClick={() => onConversationSelect(conversation)}
            >
              <div className="conversation-avatar">
                {getConversationAvatar(conversation) ? (
                  <img 
                    src={getConversationAvatar(conversation)} 
                    alt={getConversationName(conversation)}
                    className="avatar-image"
                  />
                ) : (
                  <div className={`avatar-placeholder ${conversation.type}`}>
                    {conversation.type === 'group' ? (
                      <i className="icon-users"></i>
                    ) : conversation.type === 'broadcast' ? (
                      <i className="icon-megaphone"></i>
                    ) : (
                      getConversationName(conversation).charAt(0).toUpperCase()
                    )}
                  </div>
                )}
                {isOnline && (
                  <div className="online-indicator"></div>
                )}
              </div>
              
              <div className="conversation-content">
                <div className="conversation-header">
                  <h4 className="conversation-name">
                    {getConversationName(conversation)}
                  </h4>
                  <span className="conversation-time">
                    {formatLastActivity(conversation.lastActivity)}
                  </span>
                </div>
                
                <div className="conversation-preview">
                  <p className={`last-message ${getTypingIndicator(conversation) ? 'typing' : ''}`}>
                    {getLastMessagePreview(conversation)}
                  </p>
                  
                  <div className="conversation-indicators">
                    {hasUnread && (
                      <span className="unread-badge">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                    
                    {conversation.type === 'group' && (
                      <i className="icon-users conversation-type-icon" title="Group"></i>
                    )}
                    
                    {conversation.type === 'broadcast' && (
                      <i className="icon-megaphone conversation-type-icon" title="Broadcast"></i>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ConversationList;