function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.assistantBubble) }}>
      <div style={styles.roleLabel}>{isUser ? 'You' : 'PinfoHealth'}</div>
      <div style={styles.content}>{content}</div>
    </div>
  );
}

const styles = {
  bubble: {
    maxWidth: '80%',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '12px',
    fontSize: '0.95rem',
    lineHeight: 1.5,
  },
  userBubble: {
    alignSelf: 'flex-end',
    background: '#2563eb',
    color: 'white',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    background: '#f3f4f6',
    color: '#1a1a1a',
    borderBottomLeftRadius: '4px',
  },
  roleLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
    opacity: 0.7,
  },
  content: {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  },
};

export default MessageBubble;