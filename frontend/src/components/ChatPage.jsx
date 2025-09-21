import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth0 } from '@auth0/auth0-react';
import ConversationList from './chat/ConversationList';
import ChatWindow from './chat/ChatWindow';
import UserSearch from './chat/UserSearch';
import './ChatPage.css';

const ChatPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth0();

  useEffect(() => {
    if (isConnected && user) {
      fetchConversations();
    }
  }, [isConnected, user]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('message:new', ({ conversationId, message }) => {
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), message]
      }));
      
      // Update conversation last message
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, lastMessage: message, lastActivity: new Date() }
            : conv
        )
      );
    });

    // Listen for message edits
    socket.on('message:edited', ({ conversationId, message }) => {
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(msg =>
          msg._id === message._id ? message : msg
        )
      }));
    });

    // Listen for message deletions
    socket.on('message:deleted', ({ conversationId, messageId }) => {
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter(msg => msg._id !== messageId)
      }));
    });

    // Listen for new conversations
    socket.on('conversation:new', (conversation) => {
      setConversations(prev => [conversation, ...prev]);
    });

    // Listen for conversation updates
    socket.on('conversation:updated', (conversation) => {
      setConversations(prev =>
        prev.map(conv => conv._id === conversation._id ? conversation : conv)
      );
    });

    // Listen for conversation messages (when joining)
    socket.on('conversation:messages', ({ conversationId, messages: convMessages }) => {
      setMessages(prev => ({
        ...prev,
        [conversationId]: convMessages
      }));
    });

    return () => {
      socket.off('message:new');
      socket.off('message:edited');
      socket.off('message:deleted');
      socket.off('conversation:new');
      socket.off('conversation:updated');
      socket.off('conversation:messages');
    };
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/chat/conversations?userId=${user.sub}`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    
    // Join the conversation via socket
    if (socket) {
      socket.emit('conversation:join', conversation._id);
    }
  };

  const handleStartDirectMessage = async (selectedUser) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'direct',
          participants: [selectedUser._id],
          creatorId: user.sub
        }),
      });
      
      const conversation = await response.json();
      handleConversationSelect(conversation);
      setShowUserSearch(false);
    } catch (error) {
      console.error('Error creating direct conversation:', error);
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'group',
          name: groupData.name,
          description: groupData.description,
          participants: groupData.participants,
          creatorId: user.sub
        }),
      });
      
      const conversation = await response.json();
      handleConversationSelect(conversation);
      setShowNewGroup(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="chat-header">
            <h2>Messages</h2>
            <div className="chat-actions">
              <button 
                className="btn-icon"
                onClick={() => setShowUserSearch(true)}
                title="Start new conversation"
              >
                <i className="icon-plus"></i>
              </button>
              <button 
                className="btn-icon"
                onClick={() => setShowNewGroup(true)}
                title="Create group"
              >
                <i className="icon-users"></i>
              </button>
            </div>
          </div>
          
          <ConversationList 
            conversations={conversations}
            selectedConversation={selectedConversation}
            onConversationSelect={handleConversationSelect}
            currentUserId={user?.sub}
          />
        </div>

        <div className="chat-main">
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              messages={messages[selectedConversation._id] || []}
              currentUserId={user?.sub}
            />
          ) : (
            <div className="chat-empty">
              <div className="empty-state">
                <i className="icon-message-circle"></i>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar or start a new one</p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowUserSearch(true)}
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showUserSearch && (
        <UserSearch
          onUserSelect={handleStartDirectMessage}
          onClose={() => setShowUserSearch(false)}
          currentUserId={user?.sub}
        />
      )}

      {showNewGroup && (
        <GroupCreator
          onCreateGroup={handleCreateGroup}
          onClose={() => setShowNewGroup(false)}
          currentUserId={user?.sub}
        />
      )}
    </div>
  );
};

// Simple Group Creator Modal Component
const GroupCreator = ({ onCreateGroup, onClose, currentUserId }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/chat/users/search?query=${encodeURIComponent(query)}&excludeUserId=${currentUserId}`);
      const users = await response.json();
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleUserToggle = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (groupName.trim() && selectedUsers.length > 0) {
      onCreateGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
        participants: selectedUsers.map(u => u._id)
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Create Group</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Enter group description"
              rows="2"
            />
          </div>
          <div className="form-group">
            <label>Add Members</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search users by name or email"
            />
            
            {selectedUsers.length > 0 && (
              <div className="selected-users">
                {selectedUsers.map(user => (
                  <span key={user._id} className="user-tag">
                    {user.name}
                    <button type="button" onClick={() => handleUserToggle(user)}>×</button>
                  </span>
                ))}
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(user => (
                  <div 
                    key={user._id} 
                    className={`search-result ${selectedUsers.find(u => u._id === user._id) ? 'selected' : ''}`}
                    onClick={() => handleUserToggle(user)}
                  >
                    <div className="user-info">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={!groupName.trim() || selectedUsers.length === 0}
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;