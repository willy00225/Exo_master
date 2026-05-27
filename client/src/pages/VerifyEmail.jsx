// client/src/pages/VerifyEmail.jsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      api.get(`/auth/verify-email?token=${token}`)
        .then(() => {
          window.location.href = '/email-verified';
        })
        .catch(() => {
          window.location.href = '/email-verified?error=1';
        });
    }
  }, [token]);

  return <div className="text-white text-center py-20">Vérification de votre email en cours…</div>;
};

export default VerifyEmail;