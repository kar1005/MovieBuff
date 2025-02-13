import React, { useEffect, useRef } from 'react';
import { GOOGLE_CLIENT_ID } from '../../config/googleAuth';

const GoogleAuthButton = ({ onSuccess, onError }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    // Clean up any existing google scripts
    const removeExistingScript = () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };

    // Initialize Google Sign In
    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID ,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          window.google.accounts.id.renderButton(buttonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: buttonRef.current.offsetWidth,
          });
        } catch (error) {
          console.error('Error initializing Google Sign In:', error);
          onError?.(error);
        }
      }
    };

    // Handle Google Sign In response
    const handleCredentialResponse = async (response) => {
      try {
        if (response.credential) {
          onSuccess?.(response);
        }
      } catch (error) {
        console.error('Error handling Google Sign In response:', error);
        onError?.(error);
      }
    };

    // Load Google Sign In script
    const loadGoogleScript = () => {
      removeExistingScript();
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      script.onerror = (error) => {
        console.error('Error loading Google Sign In script:', error);
        onError?.(error);
      };
      document.body.appendChild(script);
    };

    loadGoogleScript();

    // Cleanup function
    return () => {
      removeExistingScript();
      // Cleanup Google Sign In
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [onSuccess, onError]);

  return <div ref={buttonRef} className="w-full h-10" />;
};

export default GoogleAuthButton;