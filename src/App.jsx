import { useState, useCallback, useMemo } from 'react';
import './App.css';

//Constantes de validação

const CONFIG = {
  MAX_CHARS: 2000,
  MIN_PHONE_DIGITS: 10,
  MAX_PHONE_DIGITS: 15,
  RESET_TIMEOUT: 2000,
};

function App() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  //Sanitização e formatação em tempo real.

  const formatPhone = (value) => {
  // Remove tudo que não seja número ou "+"
  let digits = value.replace(/[^\d+]/g, '');

  // Mantém apenas o "+" no início, se houver
  if (digits.startsWith('+')) {
    const countryCode = digits.slice(0, 3); // máximo de 3 dígitos de DDI
    const rest = digits.slice(countryCode.length).replace(/\D/g, '');
    digits = countryCode + rest;
  } else {
    digits = digits.replace(/\D/g, '');
  }

  // Formatação simples: separa DDI, DDD e número (para visual)
  if (digits.startsWith('+')) {
    // exemplo: +5511999999999 -> +55 11 99999-9999
    const countryCode = digits.slice(0, 3); // DDI
    const ddd = digits.slice(3, 5);
    const local = digits.slice(5);
    if (local.length > 5) {
      return `${countryCode} ${ddd} ${local.slice(0, local.length - 4)}-${local.slice(-4)}`;
    }
    return `${countryCode} ${ddd} ${local}`;
  } else if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
};

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    // Limit para o tamanho máximo de um número internacional (DDI + DDD + Número)
    if (formatted.replace(/\D/g, '').length <= CONFIG.MAX_PHONE_DIGITS) {
      setPhone(formatted);
      if (error) setError('');
    }
  };

   //Lógica de envio memorizada para performance.
  
  const handleSend = useCallback(() => {
    if (isSending) return;

    const sanitizedPhone = phone.replace(/\D/g, '');
    
    // Validação
    if (sanitizedPhone.length < CONFIG.MIN_PHONE_DIGITS) {
      setError(`Please enter a valid phone number (min ${CONFIG.MIN_PHONE_DIGITS} digits).`);
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const sanitizedMessage = encodeURIComponent(message.trim());
      const url = `https://wa.me/${sanitizedPhone}${sanitizedMessage ? `?text=${sanitizedMessage}` : ''}`;
      
       // Segurança: 'noopener,noreferrer' é boa prática ao abrir novas abas
   window.open(url, '_blank', 'noopener,noreferrer');
} catch (err) {
  setError('An error occurred while generating the link.');
} finally {
  setTimeout(() => {
    setIsSending(false);
    
    // Limpa os campos após envio
    setPhone('');
    setMessage('');
  }, CONFIG.RESET_TIMEOUT);
}
  }, [phone, message, isSending]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

 // Contador de caracteres dinâmico
  const charCount = useMemo(() => message.length, [message]);
  const isOverLimit = charCount > CONFIG.MAX_CHARS;

  return (
    <div className="container">
      <header>
        <h1>Link2Chat 🚀</h1>
        <p className="subtitle">Start WhatsApp chats without saving the contact</p>
      </header>
      
      <main className="form-container">
        <div className="input-group">
          <label htmlFor="phone">Phone Number</label>
          <input 
            id="phone"
            type="tel" 
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={handlePhoneChange}
            onKeyDown={handleKeyDown}
            aria-invalid={!!error}
            autoFocus
          />
        </div>

        <div className="input-group">
          <div className="label-row">
            <label htmlFor="message">Message (Optional)</label>
            <span className={`char-counter ${isOverLimit ? 'limit-exceeded' : ''}`}>
              {charCount}/{CONFIG.MAX_CHARS}
            </span>
          </div>
          <textarea 
            id="message"
            placeholder="Hi! I'd like more information..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={CONFIG.MAX_CHARS}
          />
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <button 
          className={`submit-button ${isSending ? 'loading' : ''}`}
          onClick={handleSend} 
          disabled={isSending || isOverLimit || !phone}
        >
          {isSending ? (
            <span className="loader-text">Opening WhatsApp...</span>
          ) : (
            'Start Chat'
          )}
        </button>
      </main>

    </div>
  );
}

export default App;