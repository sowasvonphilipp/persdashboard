export const useGoogleAuth = () => {
  const config = useRuntimeConfig();
  const accessToken = useState<string | null>('googleAccessToken', () => null);
  const isAuthenticated = computed(() => !!accessToken.value);
  const authError = useState<string | null>('googleAuthError', () => null);
  
  // Cache the token client to avoid recreating it
  let tokenClient: any = null;

  // Load Google Identity Services
  const loadGoogleIdentityServices = () => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Not in browser'));
        return;
      }

      // Check if already loaded
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  };

  // Initialize OAuth client
  const initializeClient = async () => {
    // Return cached client if available
    if (tokenClient) {
      return tokenClient;
    }
    
    await loadGoogleIdentityServices();
    
    if (!window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services not loaded');
    }
    
    const clientId = config.public.googleClientId as string;
    
    if (!clientId || clientId === 'your_client_id.apps.googleusercontent.com') {
      throw new Error('Google Client ID not configured');
    }

    console.log('Initializing OAuth client with:', {
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/calendar',
      origin: window.location.origin
    });

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/calendar',
      callback: (response: any) => {
        console.log('OAuth callback received:', { 
          hasError: !!response.error, 
          hasToken: !!response.access_token,
          error: response.error,
          errorDescription: response.error_description
        });
        
        if (response.error) {
          console.error('OAuth error details:', response);
          
          // Provide more user-friendly error messages
          if (response.error === 'access_denied') {
            authError.value = 'Zugriff verweigert. Bitte erlaube die Kalender-Berechtigungen.';
          } else if (response.error === 'popup_closed_by_user') {
            authError.value = 'Anmeldung abgebrochen.';
          } else if (response.error === 'invalid_client') {
            authError.value = 'Ungültige Client-Konfiguration. Prüfe die Google Cloud Console Einstellungen.';
          } else {
            authError.value = response.error_description || `Fehler: ${response.error}`;
          }
          return;
        }
        
        if (response.access_token) {
          console.log('Access token received successfully');
          accessToken.value = response.access_token;
          authError.value = null;
          
          // Store in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('googleAccessToken', response.access_token);
            // Store expiry time (tokens typically expire in 1 hour)
            const expiryTime = Date.now() + 3600000; // 1 hour
            localStorage.setItem('googleTokenExpiry', expiryTime.toString());
          }
        } else {
          console.error('No access token in response:', response);
          authError.value = 'Kein Zugriffstoken erhalten. Bitte versuche es erneut.';
        }
      },
      error_callback: (error: any) => {
        console.error('Token request error callback:', error);
        authError.value = `Authentifizierungsfehler: ${error.type || 'Unbekannt'}`;
      }
    });
    
    return tokenClient;
  };

  // Sign in with Google
  const signIn = async () => {
    try {
      console.log('Starting sign-in process...');
      authError.value = null;
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Sign-in only available in browser');
      }
      
      // Log current origin for debugging
      console.log('Current origin:', window.location.origin);
      console.log('Current URL:', window.location.href);
      
      const client = await initializeClient();
      console.log('Client initialized, requesting access token...');
      
      // Request access token (prompt will be shown automatically if needed)
      client.requestAccessToken();
    } catch (error) {
      console.error('Error signing in:', error);
      authError.value = error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen';
    }
  };

  // Sign out
  const signOut = () => {
    // Revoke token
    if (accessToken.value && typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(accessToken.value, () => {
          console.log('Token revoked');
        });
      } catch (error) {
        console.error('Error revoking token:', error);
      }
    }
    
    accessToken.value = null;
    authError.value = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('googleAccessToken');
      localStorage.removeItem('googleTokenExpiry');
    }
  };

  // Check if token is expired
  const isTokenExpired = () => {
    if (typeof window === 'undefined') return true;
    
    const expiryTime = localStorage.getItem('googleTokenExpiry');
    if (!expiryTime) return true;
    
    const expiry = parseInt(expiryTime, 10);
    if (isNaN(expiry)) return true;
    
    return Date.now() > expiry;
  };

  // Restore token from localStorage on mount
  const restoreToken = () => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem('googleAccessToken');
    if (stored && !isTokenExpired()) {
      accessToken.value = stored;
    } else if (stored) {
      // Token expired, clear it
      localStorage.removeItem('googleAccessToken');
      localStorage.removeItem('googleTokenExpiry');
    }
  };

  // Fetch calendar events with OAuth token
  const fetchCalendarEvents = async (timeMin: string, timeMax: string) => {
    if (!accessToken.value) {
      throw new Error('Not authenticated');
    }

    // Check if token is expired
    if (isTokenExpired()) {
      signOut();
      throw new Error('Token expired');
    }

    const CALENDAR_ID = (config.public.googleCalendarId as string) || 'primary';
    
    try {
      const response = await $fetch<any>(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
        {
          params: {
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime'
          },
          headers: {
            Authorization: `Bearer ${accessToken.value}`
          }
        }
      );

      return response.items || [];
    } catch (error: any) {
      // If unauthorized, clear token and throw
      if (error.status === 401 || error.status === 403) {
        signOut();
      }
      throw error;
    }
  };

  // Create new calendar event
  const createEvent = async (eventData: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
    reminders?: {
      useDefault: boolean;
      overrides?: Array<{ method: string; minutes: number }>;
    };
  }) => {
    if (!accessToken.value) {
      throw new Error('Not authenticated');
    }

    if (isTokenExpired()) {
      signOut();
      throw new Error('Token expired');
    }

    const CALENDAR_ID = (config.public.googleCalendarId as string) || 'primary';
    
    try {
      const response = await $fetch<any>(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json'
          },
          body: eventData
        }
      );

      return response;
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        signOut();
      }
      throw error;
    }
  };

  // Update existing event
  const updateEvent = async (eventId: string, eventData: {
    summary?: string;
    description?: string;
    location?: string;
    start?: { dateTime: string; timeZone?: string };
    end?: { dateTime: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
  }) => {
    if (!accessToken.value) {
      throw new Error('Not authenticated');
    }

    if (isTokenExpired()) {
      signOut();
      throw new Error('Token expired');
    }

    const CALENDAR_ID = (config.public.googleCalendarId as string) || 'primary';
    
    try {
      const response = await $fetch<any>(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json'
          },
          body: eventData
        }
      );

      return response;
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        signOut();
      }
      throw error;
    }
  };

  // Delete event
  const deleteEvent = async (eventId: string) => {
    if (!accessToken.value) {
      throw new Error('Not authenticated');
    }

    if (isTokenExpired()) {
      signOut();
      throw new Error('Token expired');
    }

    const CALENDAR_ID = (config.public.googleCalendarId as string) || 'primary';
    
    try {
      await $fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken.value}`
          }
        }
      );

      return true;
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        signOut();
      }
      throw error;
    }
  };

  // Get calendar statistics
  const getCalendarStatistics = async (timeMin: string, timeMax: string) => {
    const events = await fetchCalendarEvents(timeMin, timeMax);
    
    const totalEvents = events.length;
    const eventsWithLocation = events.filter((e: any) => e.location).length;
    const allDayEvents = events.filter((e: any) => e.start.date).length;
    const timedEvents = events.filter((e: any) => e.start.dateTime).length;
    
    // Calculate total time spent in meetings
    let totalMinutes = 0;
    events.forEach((event: any) => {
      if (event.start.dateTime && event.end.dateTime) {
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        totalMinutes += (end.getTime() - start.getTime()) / 60000;
      }
    });
    
    return {
      totalEvents,
      eventsWithLocation,
      allDayEvents,
      timedEvents,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      averageEventDuration: totalEvents > 0 ? Math.round((totalMinutes / timedEvents) * 10) / 10 : 0
    };
  };

  return {
    accessToken,
    isAuthenticated,
    authError,
    signIn,
    signOut,
    restoreToken,
    fetchCalendarEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getCalendarStatistics
  };
};

// Type augmentation for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

export {};
