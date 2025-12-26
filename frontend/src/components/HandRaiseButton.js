import React, { useState } from 'react';

const HandRaiseButton = ({ teamId }) => {
  const [handRaised, setHandRaised] = useState(false);

  const handleToggle = () => {
    // TODO: Implement WebSocket hand raise functionality
    setHandRaised(!handRaised);
    console.log(`Hand ${handRaised ? 'lowered' : 'raised'} for team ${teamId}`);
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <button
        onClick={handleToggle}
        className={`btn ${handRaised ? 'btn-success' : 'btn-primary'}`}
        style={{ width: '100%' }}
      >
        {handRaised ? '✋ Рука поднята' : '✋ Поднять руку'}
      </button>
    </div>
  );
};

export default HandRaiseButton;

