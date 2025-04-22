'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { RiLoginCircleFill } from "react-icons/ri";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { HiOutlineMail } from "react-icons/hi";
import { BiLock } from "react-icons/bi";
import styles from '@/styles/Auth.module.css';
import {loginUser} from "@/services/auth";
import { useEffect } from 'react';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");

    const handleShowPass = () => setShowPass(!showPass);

    // Update the handleLogin function in your Login component
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
    
        if (!email || !password) {
            setError("Please enter email and password");
            return;
        }
    
        setLoading(true);
    
        try {
            const { success, token, user, error: loginError } = await loginUser(email, password);
    
            if (loginError) {
                setError(loginError.message || "Invalid email or password");
                setLoading(false);
                return;
            }
    
            if (success && user && token) {
                localStorage.setItem('rideshareToken', token);
                localStorage.setItem('rideshareUser', JSON.stringify(user));
    
                switch (user.role) {
                    case 'driver':
                        router.push(`/driverdashboard/${user._id}`);
                        break;
                    case 'rider':
                        router.push(`/riderdashboard/${user._id}`);
                        break;
                    default:
                        router.push('/dashboard');
                        break;
                }
            } else {
                setError("Login failed. Please try again.");
            }
        } catch (error) {
            setError("An unexpected error occurred. Please try again.");
            console.error("Login error:", error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className={styles.container}>
            <Head>
                <title>RideShare | Login</title>
            </Head>

            <div className={styles.formContainer}>
                <div className={styles.headerSection}>
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>Sign in to your RideShare account</p>
                </div>

                <div className={styles.formBox}>
                    <form onSubmit={handleLogin}>
                        {/* Email */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Email address</label>
                            <div className={styles.inputGroup}>
                                <div className={styles.inputIcon}>
                                    <HiOutlineMail />
                                </div>
                                <input
                                    type="email"
                                    className={styles.formInput}
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Password</label>
                            <div className={styles.inputGroup}>
                                <div className={styles.inputIcon}>
                                    <BiLock />
                                </div>
                                <input
                                    type={showPass ? "text" : "password"}
                                    className={styles.formInput}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    className={styles.eyeButton}
                                    onClick={handleShowPass}
                                    type="button"
                                >
                                    {showPass ? <FiEye /> : <FiEyeOff />}
                                </button>
                            </div>
                        </div>


                        {/* Error message */}
                        {error && (
                            <div className={styles.errorMessage}>
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : (
                                <>
                                    <RiLoginCircleFill className={styles.buttonIcon} />
                                    Sign in
                                </>
                            )}
                        </button>

                        {/* Switch to register */}
                        <div className={styles.linkContainer}>
                            <span
                                className={styles.linkText}
                                onClick={() => router.push("/register")}
                            >
                                Don't have an account? Sign up
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}