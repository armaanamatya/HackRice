import React, { useState, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, conversationId, placeholder = 'Type a message...' }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const { startTyping, stopTyping } = useSocket();
  const typingTimeoutRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), 'text', attachments);
      setMessage('');
      setAttachments([]);
      handleStopTyping();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    if (value.trim() && !isTyping) {
      handleStartTyping();
    } else if (!value.trim() && isTyping) {
      handleStopTyping();
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 3000); // Stop typing after 3 seconds of inactivity
    }
  };

  const handleStartTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping(conversationId);
    }
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping(conversationId);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Process files (in a real app, you'd upload these to a server)
    const newAttachments = files.map(file => ({
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      url: URL.createObjectURL(file) // Temporary URL for preview
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = ''; // Reset file input
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Cleanup object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      attachments.forEach(attachment => {
        if (attachment.url.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.url);
        }
      });
    };
  }, [attachments]);

  return (
    <div className="message-input-container">
      {attachments.length > 0 && (
        <div className="attachments-preview">
          {attachments.map((attachment, index) => (
            <div key={index} className="attachment-preview">
              <div className="attachment-info">
                <span className="attachment-name">{attachment.filename}</span>
                <span className="attachment-size">{formatFileSize(attachment.size)}</span>
              </div>
              <button 
                type="button" 
                className="remove-attachment"
                onClick={() => removeAttachment(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="message-input-wrapper">
          <button 
            type="button" 
            className="btn-icon attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            📎
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            style={{ display: 'none' }}
            accept="image/*,application/pdf,.doc,.docx,.txt"
          />
          
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleStopTyping}
            placeholder={placeholder}
            className="message-input"
            rows="1"
          />
          
          <button 
            type="submit" 
            className="btn-send"
            disabled={!message.trim() && attachments.length === 0}
            title="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;