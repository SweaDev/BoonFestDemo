/**
 * Google Authentication Helper
 * Integrates Google Identity Services (GSI) with fallbacks for sandboxed environments.
 */

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: unknown) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill';
              logo_alignment?: 'left' | 'center';
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

export interface GoogleAuthPayload {
  credential?: string;
  email?: string;
  name?: string;
  googleId?: string;
  desiredUsername?: string;
}

export const getGoogleClientId = (): string => {
  return ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_CLIENT_ID as string) || '';
};

export const isGsiAvailable = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.google?.accounts?.id);
};

export const initGoogleSignIn = (
  callback: (payload: GoogleAuthPayload) => void,
  clientId?: string
): boolean => {
  const actualClientId = clientId || getGoogleClientId();
  if (!actualClientId || !isGsiAvailable() || !window.google?.accounts?.id) {
    return false;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: actualClientId,
      callback: (response) => {
        if (response.credential) {
          callback({ credential: response.credential });
        }
      },
      cancel_on_tap_outside: true,
    });
    return true;
  } catch (err) {
    console.warn('Google Identity Services initialization failed:', err);
    return false;
  }
};
