import React, { useState } from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
  width: 100%;
  height: 100vh;
  background: #f4e682;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const LoginBox = styled.div`
  width: 440px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 600;
  color: #000;
  margin-bottom: 40px;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  margin-bottom: 16px;
  border: none;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  box-sizing: border-box;
  
  &::placeholder {
    color: #999;
  }
  
  &:focus {
    outline: 2px solid #000;
  }
`;

const Label = styled.label`
  display: block;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #000;
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  margin-top: 8px;
  border: none;
  border-radius: 8px;
  background: #000;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  margin: 24px 0;
  text-align: center;
  color: #666;
  font-size: 14px;
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  color: #000;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s;
  
  &:hover {
    background: #f9f9f9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SignUpLink = styled.div`
  margin-top: 24px;
  font-size: 14px;
  color: #666;
  
  a {
    color: #0066cc;
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
`;

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onGoogleSignIn,
  onSignUp,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await onSignUp(email, password);
      } else {
        await onLogin(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await onGoogleSignIn();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LoginBox>
        <Title>{isSignUp ? 'Create your account' : 'Sign in your account'}</Title>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <form onSubmit={handleSubmit}>
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="ex: jon.smith@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <Label>Password</Label>
          <Input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <Button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'SIGN UP' : 'SIGN IN'}
          </Button>
        </form>

        <SignUpLink>
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <a onClick={() => setIsSignUp(false)}>SIGN IN</a>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <a onClick={() => setIsSignUp(true)}>SIGN UP</a>
            </>
          )}
        </SignUpLink>
      </LoginBox>
    </Container>
  );
};

