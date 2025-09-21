import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth0 } from '@auth0/auth0-react';
import { format, isToday, isYesterday } from 'date-fns';
import { 
  IconMessageCircle, 
  IconPlus, 
  IconUsers, 
  IconSend,
  IconX,
  IconChevronRight,
  IconChevronLeft
} from '@tabler/icons-react';
import './ChatSidebar.css';

const ChatSidebar = ({ userData }) => { // Accept userData prop
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { socket, isConnected, sendMessage } = useSocket();
  const { user } = useAuth0();

  const fetchConversations = React.useCallback(async () => {
    if (!user?.sub) {
      console.log('No user.sub available for fetching conversations');
      return;
    }
    
    try {
      const response = await fetch(`/api/chat/conversations?userId=${user.sub}`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [user?.sub]);

  useEffect(() => {
    if (isConnected && user?.sub) {
      fetchConversations();
    }
  }, [isConnected, user?.sub]); // Remove fetchConversations from dependencies

  // Listen for custom group chat events from ScheduleCalendar
  useEffect(() => {
    const handleGroupChatJoined = (event) => {
      console.log('Group chat joined event received:', event.detail);
      // Refresh conversations to show the new group
      if (user?.sub) {
        fetchConversations();
      }
    };

    window.addEventListener('groupChatJoined', handleGroupChatJoined);
    
    return () => {
      window.removeEventListener('groupChatJoined', handleGroupChatJoined);
    };
  }, [user?.sub]); // Remove fetchConversations from dependencies

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

    // Listen for new conversations
    socket.on('conversation:new', (conversation) => {
      setConversations(prev => [conversation, ...prev]);
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
      socket.off('conversation:new');
      socket.off('conversation:messages');
    };
  }, [socket]);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    
    // Join the conversation via socket
    if (socket) {
      socket.emit('conversation:join', conversation._id);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedConversation) {
      sendMessage(selectedConversation._id, newMessage.trim());
      setNewMessage('');
    }
  };

  const formatLastActivity = (date) => {
    const activityDate = new Date(date);
    if (isToday(activityDate)) {
      return format(activityDate, 'HH:mm');
    } else if (isYesterday(activityDate)) {
      return 'Yesterday';
    } else {
      return format(activityDate, 'dd/MM');
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'direct') {
      // For direct conversations, we need to find the other participant
      const otherParticipant = conversation.participants.find(p => p.auth0Id !== user.sub);
      return otherParticipant?.name || 'Unknown User';
    }
    return conversation.name;
  };

  const getLastMessagePreview = (conversation) => {
    if (conversation.lastMessage) {
      const message = conversation.lastMessage;
      const isCurrentUser = message.sender?.auth0Id === user.sub;
      
      let preview = '';
      if (conversation.type !== 'direct') {
        preview = isCurrentUser ? 'You: ' : `${message.sender?.name}: `;
      }
      
      preview += message.content;
      return preview.length > 30 ? preview.substring(0, 30) + '...' : preview;
    }
    
    return 'Start a conversation...';
  };

  const conversationMessages = selectedConversation ? messages[selectedConversation._id] || [] : [];

  return (
    <>
      <div className={`chat-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="chat-header">
          <div className="chat-title">
            <IconMessageCircle size={18} />
            <span>Messages</span>
          </div>
          <div className="chat-controls">
            <button 
              className="btn-icon"
              onClick={() => setShowNewChatModal(true)}
              title="New chat"
            >
              <IconPlus size={16} />
            </button>
            <button 
              className="btn-icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <IconChevronLeft size={16} /> : <IconChevronRight size={16} />}
            </button>
          </div>
        </div>

      <div className="chat-content">
        {!selectedConversation ? (
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="empty-conversations">
                <IconMessageCircle size={32} />
                <p>No conversations yet</p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowNewChatModal(true)}
                >
                  Start chatting
                </button>
              </div>
            ) : (
              <div className="conversation-items">
                {conversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    className={`conversation-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="conversation-avatar">
                      <div className="avatar-placeholder">
                        {getConversationName(conversation).charAt(0).toUpperCase()}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="unread-badge">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <span className="conversation-name">
                          {getConversationName(conversation)}
                        </span>
                        <span className="conversation-time">
                          {formatLastActivity(conversation.lastActivity)}
                        </span>
                      </div>
                      <p className="last-message">
                        {getLastMessagePreview(conversation)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="chat-conversation">
            <div className="conversation-header">
              <button 
                className="back-btn"
                onClick={() => setSelectedConversation(null)}
              >
                ←
              </button>
              <span className="conversation-title">
                {getConversationName(selectedConversation)}
              </span>
            </div>
            
            <div className="messages-container">
              {conversationMessages.map((message) => {
                const isOwnMessage = message.sender.auth0Id === user.sub;
                return (
                  <div key={message._id} className={`message ${isOwnMessage ? 'own' : 'other'}`}>
                    {!isOwnMessage && selectedConversation.type !== 'direct' && (
                      <div className="message-sender">{message.sender.name}</div>
                    )}
                    <div className="message-content">{message.content}</div>
                    <div className="message-time">
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button 
                type="submit" 
                className="send-btn"
                disabled={!newMessage.trim()}
              >
                <IconSend size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {showNewChatModal && (
        <NewChatModal 
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={(conversation) => {
            handleConversationSelect(conversation);
            setShowNewChatModal(false);
          }}
          currentUserId={user?.sub}
          currentUserDbId={userData?._id} // Pass the database ID
        />
      )}
      </div>

      {/* Floating expand button when collapsed */}
      {isCollapsed && (
        <button 
          className="chat-expand-btn"
          onClick={() => setIsCollapsed(false)}
          title="Expand Messages"
        >
          <IconChevronLeft size={20} />
        </button>
      )}
    </>
  );
};

// Enhanced Student Search and Invite Modal
const NewChatModal = ({ onClose, onChatCreated, currentUserId, currentUserDbId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [error, setError] = useState('');

  // Remove the useEffect and currentUserDbId state since we get it as prop

  const universities = [
    'University of Houston',
    'Rice University',
    'University of Texas at Dallas',
    'Texas A&M University'
  ];

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      let searchParams = new URLSearchParams({
        query: query,
        excludeUserId: currentUserId
      });
      
      if (selectedUniversity) {
        searchParams.append('university', selectedUniversity);
      }
      
      const response = await fetch(`/api/chat/users/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const users = await response.json();
      setSearchResults(users);
      
      if (users.length === 0 && query.length >= 2) {
        setError('No students found matching your search');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = async (selectedUser) => {
    try {
      setIsLoading(true);
      setError(''); // Clear previous errors
      
      if (!currentUserDbId) {
        throw new Error('Current user database ID not found');
      }
      
      const requestBody = {
        type: 'direct',
        participants: [selectedUser.dbId], // Use the selected user's database ID
        creatorId: currentUserDbId // Use current user's database ID
      };
      
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create conversation: ${errorData.message || 'Unknown error'}`);
      }
      
      const conversation = await response.json();
      onChatCreated(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError(`Failed to start conversation: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };


  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="new-chat-modal enhanced">
        <div className="modal-header">
          <h3>Find Students to Chat With</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="search-section">
          <div className="search-filters">
            <select 
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="university-filter"
            >
              <option value="">All Universities</option>
              {universities.map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>
          
          <div className="search-input-container">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search by name, email, or major..."
              className="search-input enhanced"
              disabled={isLoading}
            />
            {isLoading && (
              <div className="search-spinner">
                <div className="spinner"></div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="search-error">
              {error}
            </div>
          )}
        </div>

        <div className="search-results enhanced">
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <div className="search-hint">
              <i>💡 Type at least 2 characters to search</i>
            </div>
          )}
          
          {searchQuery.length >= 2 && searchResults.length === 0 && !isLoading && !error && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <p>No students found</p>
              <small>Try searching with different keywords or check another university</small>
            </div>
          )}
          
          {searchResults.map((student) => (
            <div
              key={student._id}
              className="student-result"
              onClick={() => handleUserSelect(student)}
            >
              <div className="student-avatar">
                <div className="avatar-placeholder">
                  {student.name.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div className="student-info">
                <div className="student-primary">
                  <h4 className="student-name">{student.name}</h4>
                  <span className="student-email">{student.email}</span>
                </div>
                
                <div className="student-details">
                  {student.university && (
                    <div className="student-university">
                      <span>{student.university}</span>
                    </div>
                  )}
                  
                  <div className="student-academic">
                    {student.major && <span className="major">{student.major}</span>}
                    {student.year && <span className="year">Year {student.year}</span>}
                  </div>
                </div>
              </div>
              
              <div className="invite-action">
                <button className="invite-btn">
                  💬 Chat
                </button>
              </div>
            </div>
          ))}
        </div>

        {searchResults.length > 0 && (
          <div className="modal-footer">
            <small className="results-count">
              Found {searchResults.length} student{searchResults.length !== 1 ? 's' : ''}
              {selectedUniversity && ` at ${selectedUniversity}`}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;