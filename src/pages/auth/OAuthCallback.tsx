// src/components/OAuthCallback.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in strict mode
    if (processedRef.current) return;
    processedRef.current = true;

    const handleOAuthCallback = async () => {
      try {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const setupPending = searchParams.get('setupPending') === 'true';
        const error = searchParams.get('error');

        setDebugInfo(`Params: AccessToken=${!!accessToken}, RefreshToken=${!!refreshToken}, SetupPending=${setupPending}`);

        // Handle errors first
        if (error) {
          setStatus('error');
          setDebugInfo(prev => prev + '\nServer Error: ' + error);
          toast.error('عذراً، حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
          return;
        }

        // Validate required tokens
        if (!accessToken || !refreshToken) {
          setStatus('error');
          setDebugInfo(prev => prev + '\nMissing Tokens');
          toast.error('تعذر إتمام تسجيل الدخول. يرجى المحاولة مرة أخرى.');
          return;
        }

        // Use AuthContext to login with tokens
        try {
          await loginWithTokens(accessToken, refreshToken);

          setStatus('success');
          toast.success('Successfully logged in with Google!');

          // Redirect based on setup status
          setTimeout(() => {
            if (setupPending) {
              navigate('/dashboard/settings', { 
                state: { setupRequired: true } 
              });
            } else {
              navigate('/dashboard');
            }
          }, 1000);

        } catch (loginError) {
          console.error('Login with tokens error:', loginError);
          setStatus('error');
          setDebugInfo(prev => prev + '\nLogin Error: ' + (loginError instanceof Error ? loginError.message : String(loginError)));
          toast.error('تعذر التحقق من جلسة تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        }

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setDebugInfo(prev => prev + '\nGeneral Error: ' + (error instanceof Error ? error.message : String(error)));
        toast.error('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, loginWithTokens]);

  const getStatusContent = () => {
    switch (status) {
      case 'processing':
        return {
          title: 'Completing authentication...',
          message: 'Please wait while we redirect you.',
          icon: '🔄',
          color: 'text-blue-500'
        };
      case 'success':
        return {
          title: 'Authentication successful!',
          message: 'Redirecting to your dashboard...',
          icon: '✅',
          color: 'text-green-500'
        };
      case 'error':
        return {
          title: 'Authentication failed',
          message: 'Please try logging in again.',
          icon: '❌',
          color: 'text-red-500'
        };
      default:
        return {
          title: 'Processing...',
          message: 'Please wait.',
          icon: '🔄',
          color: 'text-blue-500'
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4 w-full">
        <div className={`text-4xl mb-4 ${content.color}`}>
          {content.icon}
        </div>
        
        {status === 'processing' && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        )}
        
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {content.title}
        </h2>
        <p className="text-gray-600 mb-6">{content.message}</p>
        
        <div className="flex flex-col gap-3">
          {status === 'success' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full"
            >
              Go to Dashboard
            </button>
          )}
          
          {status === 'error' && (
            <button
              onClick={() => navigate('/auth/login')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors w-full"
            >
              Back to Login
            </button>
          )}
        </div>

        {/* Debug Info (Hidden by default, visible if needed) */}
        {status === 'error' && debugInfo && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-left text-xs font-mono overflow-auto max-h-40">
            <p className="font-bold mb-1">Debug Info:</p>
            <pre>{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;