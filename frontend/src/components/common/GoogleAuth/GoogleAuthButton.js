import React, { useEffect, useRef } from 'react';
import { GOOGLE_CLIENT_ID } from '../../../config/googleAuth';

const GoogleAuthButton = ({ onSuccess, onError }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const googleClientId = GOOGLE_CLIENT_ID || '218289952587-bebhhcrcm37cm4j65p72lnnjv85834bf.apps.googleusercontent.com';
    console.log('Initializing Google Auth with client ID:', googleClientId);

    // Clean up any existing google scripts
    const removeExistingScript = () => {
      try {
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
          console.log('Removing existing Google script');
          document.body.removeChild(existingScript);
        }
      } catch (error) {
        console.error('Error removing existing Google script:', error);
      }
    };

    // Initialize Google Sign In
    const initializeGoogleSignIn = () => {
      console.log('Starting Google Sign In initialization');
      if (window.google?.accounts?.id) {
        try {
          console.log('Google accounts API found, initializing...');
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (buttonRef.current) {
            console.log('Rendering Google button');
            window.google.accounts.id.renderButton(buttonRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: buttonRef.current.offsetWidth || 280,
            });
          } else {
            console.error('Button reference is null, cannot render Google button');
          }
        } catch (error) {
          console.error('Error initializing Google Sign In:', error);
          onError?.(new Error(`Google Sign In initialization failed: ${error.message}`));
        }
      } else {
        console.error('Google accounts API not found after script load');
        onError?.(new Error('Google accounts API not available'));
      }
    };

    // Handle Google Sign In response
    const handleCredentialResponse = async (response) => {
      try {
        console.log('Received Google credential response');
        if (response.credential) {
          console.log('Credential received successfully, calling onSuccess');
          onSuccess?.(response);
        } else {
          console.error('No credential found in Google response', response);
          onError?.(new Error('No credential received from Google'));
        }
      } catch (error) {
        console.error('Error handling Google Sign In response:', error);
        onError?.(new Error(`Error processing Google authentication: ${error.message}`));
      }
    };

    // Load Google Sign In script
    const loadGoogleScript = () => {
      console.log('Loading Google Sign In script');
      if (!window.google) {
        removeExistingScript();
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('Google script loaded successfully');
          initializeGoogleSignIn();
        };
        script.onerror = (error) => {
          console.error('Error loading Google Sign In script:', error);
          onError?.(new Error('Failed to load Google authentication script'));
        };
        document.body.appendChild(script);
      } else {
        console.log('Google API already loaded, initializing directly');
        initializeGoogleSignIn();
      }
    };

    loadGoogleScript();

    // Cleanup function
    return () => {
      console.log('Cleaning up Google Auth Button');
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.cancel();
          console.log('Google Sign In canceled');
        }
      } catch (error) {
        console.error('Error during Google Auth cleanup:', error);
      }
    };
  }, [onSuccess, onError]);

  return (
    <div 
      ref={buttonRef} 
      className="w-full" 
      style={{ minHeight: '40px', minWidth: '240px' }} 
      data-testid="google-auth-button"
    />
  );
};

export default GoogleAuthButton;