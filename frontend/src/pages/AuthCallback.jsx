import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import LoadingScreen from '../components/common/LoadingScreen';
import api from '../utils/api';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const isNew = params.get('new') === 'true';
    const error = params.get('error');

    if (error) {
      toast.error('Google sign-in failed. Only @srmsp.edu.in accounts are allowed.');
      navigate('/login');
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user data using the token
    localStorage.setItem('token', token);
    api.get('/auth/me')
      .then(({ data }) => {
        login(token, data.user);
        if (isNew) toast.success(`Welcome to Smart Campus, ${data.user.name.split(' ')[0]}!`);
        else toast.success('Signed in with Google!');
        navigate('/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('token');
        toast.error('Authentication failed');
        navigate('/login');
      });
  }, []); // eslint-disable-line

  return <LoadingScreen />;
}
