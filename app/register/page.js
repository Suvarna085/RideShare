'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { RiLoginCircleFill } from "react-icons/ri";
import { FiUser, FiEye, FiEyeOff } from "react-icons/fi";
import { HiOutlineMail } from "react-icons/hi";
import { BiLock, BiCar } from "react-icons/bi";
import { MdOutlineLocationOn, MdOutlineDriveEta } from "react-icons/md";
import { FaCarSide, FaIdCard } from "react-icons/fa";
import styles from '@/styles/Auth.module.css';
import { registerUser } from "@/services/auth";

export default function Register() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    
    // Role-specific fields
    const [homeLocation, setHomeLocation] = useState("");
    const [workLocation, setWorkLocation] = useState("");
    const [vehicleDetails, setVehicleDetails] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");

    const handleShowPass = () => setShowPass(!showPass);

    // Replace the clickSubmit function with this static version
// Update the clickSubmit function in your Register component
const clickSubmit = async () => {
    setError("");

    if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
    }

    if (!name || !email || !password || !role) {
        setError("Please fill all required fields");
        return;
    }

    if (role === "Rider" && (!homeLocation || !workLocation)) {
        setError("Please enter your home and work locations");
        return;
    }

    if (role === "Driver" && (!homeLocation || !workLocation || !vehicleDetails || !licenseNumber)) {
        setError("Please enter all driver details");
        return;
    }

    setLoading(true);

    const additionalInfo = {};
    if (role === "Rider" || role === "Driver") {
        additionalInfo.homeLocation = homeLocation;
        additionalInfo.workLocation = workLocation;
        
        if (role === "Driver" ) {
            additionalInfo.vehicleDetails = vehicleDetails;
            additionalInfo.licenseNumber = licenseNumber;
        }
    }

    try {
        const { success, error: registrationError } = await registerUser({ 
            name, 
            email, 
            password, 
            role,
            additionalInfo
        });

        if (registrationError) {
            setError(`Registration failed: ${registrationError.message}`);
            setLoading(false);
            return;
        }

        alert("Registration successful!");
        router.push("/login");
    } catch (error) {
        setError("An unexpected error occurred. Please try again.");
        console.error("Registration error:", error);
    } finally {
        setLoading(false);
    }
};


    return (
        <div className={styles.container}>
            <Head>
                <title>RideShare | Register</title>
            </Head>

            <div className={styles.formContainer}>
                <div className={styles.headerSection}>
                    <h1 className={styles.title}>Join RideShare Today</h1>
                    <p className={styles.subtitle}>Share rides, save money, reduce emissions</p>
                </div>

                <div className={styles.formBox}>
                    {/* Name */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Name</label>
                        <div className={styles.inputGroup}>
                            <div className={styles.inputIcon}>
                                <FiUser />
                            </div>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="Jack Ryan"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

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
                                placeholder="jack@outlook.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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

                    {/* Confirm Password */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Confirm Password</label>
                        <div className={styles.inputGroup}>
                            <div className={styles.inputIcon}>
                                <BiLock />
                            </div>
                            <input
                                type={showPass ? "text" : "password"}
                                className={styles.formInput}
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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

                    {/* Role */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>I want to</label>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="Rider"
                                    checked={role === "Rider"}
                                    onChange={(e) => setRole(e.target.value)}
                                    className={styles.radioInput}
                                />
                                <span className={styles.radioText}>Find Rides</span>
                            </label>

                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="Driver"
                                    checked={role === "Driver"}
                                    onChange={(e) => setRole(e.target.value)}
                                    className={styles.radioInput}
                                />
                                <span className={styles.radioText}>Offer Rides</span>
                            </label>
                        </div>
                    </div>

                    {/* Common fields for all roles except Admin */}
                    {(role === "Rider" || role === "Driver") && (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Home Location</label>
                                <div className={styles.inputGroup}>
                                    <div className={styles.inputIcon}>
                                        <MdOutlineLocationOn />
                                    </div>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="e.g., 123 Main St, City"
                                        value={homeLocation}
                                        onChange={(e) => setHomeLocation(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Work/School Location</label>
                                <div className={styles.inputGroup}>
                                    <div className={styles.inputIcon}>
                                        <MdOutlineLocationOn />
                                    </div>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="e.g., 456 Business Ave, City"
                                        value={workLocation}
                                        onChange={(e) => setWorkLocation(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Driver-specific fields */}
                    {(role === "Driver") && (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Vehicle Details</label>
                                <div className={styles.inputGroup}>
                                    <div className={styles.inputIcon}>
                                        <FaCarSide />
                                    </div>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="e.g., Toyota Camry 2020, Blue"
                                        value={vehicleDetails}
                                        onChange={(e) => setVehicleDetails(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Driver's License Number</label>
                                <div className={styles.inputGroup}>
                                    <div className={styles.inputIcon}>
                                        <FaIdCard />
                                    </div>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="License Number"
                                        value={licenseNumber}
                                        onChange={(e) => setLicenseNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        className={styles.submitButton}
                        onClick={clickSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Creating your account...' : (
                            <>
                                <RiLoginCircleFill className={styles.buttonIcon} />
                                Join RideShare
                            </>
                        )}
                    </button>

                    {/* Switch to login */}
                    <div className={styles.linkContainer}>
                        <span
                            className={styles.linkText}
                            onClick={() => router.push("/login")}
                        >
                            Already have an account? Login
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}