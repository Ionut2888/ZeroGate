import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const Auth: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const switchToRegister = () => setIsLoginMode(false);
  const switchToLogin = () => setIsLoginMode(true);

  const handleRegisterSuccess = () => {
    // Automatically switch to login after successful registration
    setIsLoginMode(true);
  };

  if (isLoginMode) {
    return <Login onSwitchToRegister={switchToRegister} />;
  } else {
    return <Register onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={switchToLogin} />;
  }
};

export default Auth;
