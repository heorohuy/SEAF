import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function AuthButton() {
  const navigate = useNavigate();

  const {
    user,
    loading,
    signOut,
  } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="header-auth-button"
      >
        <LogIn size={18} />
        <span>LOGIN</span>
      </Link>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error(
        'Failed to sign out:',
        error,
      );
    }
  };


  return (
    <button
      type="button"
      className="header-auth-button"
      onClick={handleLogout}
      title={user.email ?? 'Authenticated user'}
    >
      <User size={18} />
      <span>LOGOUT</span>
      <LogOut size={16} />
    </button>
  );
}
