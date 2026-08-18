function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
      <div className="bubble-role">{isUser ? 'You' : 'PinfoHealth'}</div>
      <div className="bubble-content">{content}</div>
    </div>
  );
}

export default MessageBubble;