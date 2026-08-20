function MessageBubble({ role, content, ui = [], renderUIComponent, onUIAction }) {
  const isUser = role === 'user';
  return (
    <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
      <div className="bubble-role">{isUser ? 'You' : 'PinfoHealth'}</div>
      <div className="bubble-content">{content}</div>
      {!isUser && ui.length > 0 && (
        <div className="message-ui">
          {ui.map((block, idx) => (
            <div key={idx} className="ui-block">
              {renderUIComponent(block.component, block.props, (action, payload) => onUIAction?.(block.component, action, payload))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;