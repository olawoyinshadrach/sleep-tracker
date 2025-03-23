import React, { useState, useEffect } from 'react';
import { auth } from "../firebase-config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import axios from 'axios';

import '../styles/forgottenpasswordpage.css'

const ForgottenPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    // firebase api
    const firebaseapi = () => {
        const auth = getAuth();
        sendPasswordResetEmail(auth, email)
            .then(() => {
                alert("Password reset email sent!")
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
            });
    }


    return (
        <div className='forgotten-password'>
            <h2>Forgotten Your Password?</h2>
            <p>Enter your email address below, and we'll send you a link to reset your password.</p>
            <div className='form-group'>
                <form onSubmit={firebaseapi}>
                    <input
                        className='form-input'
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" onClick={firebaseapi}>Submit</button>
                </form>
            </div>
            {message && <p className='message'>{message}</p>}
        </div>
    );
};

export default ForgottenPasswordPage;