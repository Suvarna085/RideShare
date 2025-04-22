'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Head from "next/head";
import { RiLogoutBoxLine, RiUserLine } from "react-icons/ri";
import { FiAlertCircle, FiList, FiPlus, FiClock, FiMapPin, FiCalendar, FiCheckCircle, FiUser } from "react-icons/fi";
import { MdDirectionsCar } from "react-icons/md";
import styles from '@/styles/Auth.module.css';
import dashboardStyles from '@/styles/Dashboard.module.css';

export default function DriverDashboard() {
    const router = useRouter();
    const params = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('myRides');
    const [myRides, setMyRides] = useState([]);
    const [rideRequests, setRideRequests] = useState([]);
    const [showRideModal, setShowRideModal] = useState(false);
    const [newRide, setNewRide] = useState({
        source: '',
        destination: '',
        date: '',
        time: '',
        seats: 1,
        notes: ''
    });
    const [error, setError] = useState('');
    const [apiError, setApiError] = useState(null);
    const [selectedRide, setSelectedRide] = useState(null);
    const [showRideDetailsModal, setShowRideDetailsModal] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Debug logs
                console.log("Token:", localStorage.getItem('rideshareToken'));
                console.log("User data:", localStorage.getItem('rideshareUser'));
                console.log("URL param ID:", params.id);
    
                // Check for token first
                const token = localStorage.getItem('rideshareToken');
                if (!token) {
                    console.log("No authentication token found");
                    setLoading(false);
                    router.replace('/login');
                    return;
                }
    
                // Then check for user data
                const userStr = localStorage.getItem('rideshareUser');
                if (!userStr) {
                    console.log("No user data found in localStorage");
                    setLoading(false);
                    router.replace('/login');
                    return;
                }
    
                const userData = JSON.parse(userStr);
                console.log("Parsed user data:", userData);
                
                if (!userData || !userData._id) {
                    console.log("Invalid user data found");
                    localStorage.removeItem('rideshareToken');
                    localStorage.removeItem('rideshareUser');
                    setLoading(false);
                    router.replace('/login');
                    return;
                }
    
                // Check if URL exists and matches user ID
                const driverId = params.id;
                console.log(`Comparing driver ID (${driverId}) with user ID (${userData._id})`);
                
                if (driverId && driverId !== userData._id) {
                    console.log("User ID mismatch: Access denied");
                    setLoading(false);
                    router.replace('/login');
                    return;
                }
    
                setUser(userData);
                await loadDashboardData(userData._id);
                setLoading(false);
            } catch (err) {
                console.error("Error during authentication check:", err);
                setLoading(false);
                router.replace('/login');
            }
        };
    
        checkAuth();
    }, [router, params.id]);

    const loadDashboardData = async (userId) => {
        if (!userId) return;

        try {
            await Promise.all([
                fetchMyRides(userId),
                fetchRideRequests()
            ]);
        } catch (err) {
            console.error("Error loading dashboard data:", err);
            setApiError("Could not load dashboard data. Please try again later.");
        }
    };

    const fetchMyRides = async (userId) => {
        try {
            if (!userId) {
                console.error("No valid user ID available");
                setMyRides([]);
                return;
            }
            const response = await fetch(`/api/rides/driver/${userId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Server responded with status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success && data.rides) {
                setMyRides(data.rides);
            } else {
                setMyRides([]);
            }
        } catch (err) {
            console.error("Error fetching driver rides:", err);
            setMyRides([]);
        }
    };

    const fetchRideRequests = async () => {
        try {
            const response = await fetch('/api/rides/requests');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Server responded with status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success && data.rides) {
                setRideRequests(data.rides);
            } else {
                setRideRequests([]);
            }
        } catch (err) {
            console.error("Error fetching ride requests:", err);
            setRideRequests([]);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('rideshareToken');
        localStorage.removeItem('rideshareUser');
        router.replace('/login');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'Unknown time';
        return timeString;
    };

    const handleCreateRide = () => {
        setNewRide({
            source: '',
            destination: '',
            date: '',
            time: '',
            seats: 1,
            notes: ''
        });
        setError('');
        setShowRideModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewRide(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleViewRideDetails = (ride) => {
        setSelectedRide(ride);
        setShowRideDetailsModal(true);
    };

    const handleCompleteRide = async (rideId) => {
        try {
            if (!rideId) {
                alert('Ride ID is missing. Cannot complete ride.');
                return;
            }
      
            if (!user || !user._id) {
                console.error("User data is missing:", { user });
                alert('User information missing. Please try logging in again.');
                return;
            }
      
            const driverId = user._id.toString();
            console.log(`Completing ride with ID: ${rideId}, Driver ID: ${driverId}`);
      
            const payload = { driverId };
            console.log("Request payload:", payload);
    
            const response = await fetch(`/api/rides/complete/${rideId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('rideshareToken')}`,
                },
                body: JSON.stringify(payload),
            });
      
            console.log("Complete ride response status:", response.status);
      
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text();
                console.error(`Server returned non-JSON response:`, textResponse);
                throw new Error(`Server returned non-JSON response: ${textResponse}`);
            }
      
            const data = await response.json();
            console.log("Complete ride response data:", data);
      
            if (!response.ok) {
                throw new Error(data.message || 'Failed to complete ride');
            }
      
            // Update rides list
            await fetchMyRides(user._id);
      
            // Close the modal and show success message
            setShowRideDetailsModal(false);
            alert('Ride marked as completed successfully');
      
        } catch (err) {
            console.error("Error completing ride:", err);
            alert(err.message || 'Failed to complete ride');
        }
    };
      
    const handleCancelRide = async (rideId) => {
        try {
            if (!rideId) {
                alert('Ride ID is missing. Cannot cancel ride.');
                return;
            }
            
            if (!user || !user._id) {
                alert('User information missing. Please try logging in again.');
                return;
            }
            
            console.log(`Cancelling ride with ID: ${rideId}`);
            
            const response = await fetch(`/api/rides/cancel/${rideId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('rideshareToken')}`
                },
                body: JSON.stringify({
                    userId: user._id
                })
            });
            
            console.log("Cancel ride response status:", response.status);
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text();
                console.error(`Server returned non-JSON response:`, textResponse);
                throw new Error(`Server returned non-JSON response: ${textResponse}`);
            }
            
            const data = await response.json();
            console.log("Cancel ride response data:", data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to cancel ride');
            }
            
            // Update rides list
            await fetchMyRides(user._id);
            
            // Close the modal and show success message
            setShowRideDetailsModal(false);
            alert('Ride cancelled successfully');
            
        } catch (err) {
            console.error("Error canceling ride:", err);
            alert(err.message || 'Failed to cancel ride');
        }
    };


    const handleAcceptRide = async (rideId) => {
        try {
            const token = localStorage.getItem('rideshareToken');
            if (!token) {
                alert('Authentication required. Please log in again.');
                router.replace('/login');
                return;
            }

            const response = await fetch(`/api/rides/accept/${rideId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    driverId: user._id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to accept ride request');
            }

            const data = await response.json();
            
            if (data.success) {
                // Refresh both ride lists after accepting a ride
                if (user && user._id) {
                    await Promise.all([
                        fetchMyRides(user._id),
                        fetchRideRequests()
                    ]);
                }
                alert('Ride request accepted successfully!');
            } else {
                throw new Error(data.message || 'Failed to accept ride request');
            }
        } catch (err) {
            console.error('Error accepting ride request:', err);
            alert(err.message || 'An error occurred while accepting the ride request');
        }
    };

    const getRideStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return dashboardStyles.statusPending;
            case 'confirmed':
                return dashboardStyles.statusConfirmed;
            case 'completed':
                return dashboardStyles.statusCompleted;
            case 'cancelled':
                return dashboardStyles.statusCancelled;
            default:
                return '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError('');

            if (!user || !user._id) {
                setError('User authentication error. Please log in again.');
                setTimeout(() => router.replace('/login'), 2000);
                return;
            }

            const rideData = {
                ...newRide,
                driver: user._id
            };

            const result = await submitNewRide(rideData);

            if (result.success) {
                setShowRideModal(false);
                await fetchMyRides(user._id);
                alert('Ride created successfully!');
            } else {
                setError(result.message || 'Failed to create ride');
            }
        } catch (err) {
            console.error('Error creating ride:', err);
            setError(err.message || 'An error occurred while creating the ride');
        }
    };

    if (loading) {
        return (
            <div className={dashboardStyles.container}>
                <Head><title>Rideshare | Loading Dashboard</title></Head>
                <div className={dashboardStyles.loadingContainer}>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={dashboardStyles.container}>
                <Head><title>Rideshare | Login Required</title></Head>
                <div className={dashboardStyles.accessDenied}>
                    <h1>Login Required</h1>
                    <p>Please log in to access your driver dashboard.</p>
                    <button
                        className={dashboardStyles.loginButton}
                        onClick={() => router.push('/login')}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className={dashboardStyles.container}>
            <Head><title>Rideshare | Driver Dashboard</title></Head>

            <div className={dashboardStyles.dashboardContainer}>
                <div className={dashboardStyles.headerBar}>
                    <div className={dashboardStyles.headerSection}>
                        <h1 className={styles.title}>Driver Dashboard</h1>
                        <p className={styles.subtitle}>
                            Welcome, {user?.name || 'Driver'}
                        </p>
                    </div>

                    <div className={dashboardStyles.profileSection}>
                        <div
                            className={dashboardStyles.profileButton}
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        >
                            <div className={dashboardStyles.profileAvatar}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
                            </div>
                            {showProfileDropdown && (
                                <div className={dashboardStyles.profileDropdown}>
                                    <button onClick={handleLogout} className={dashboardStyles.profileDropdownItem}>
                                        <RiLogoutBoxLine className={dashboardStyles.dropdownIcon} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={dashboardStyles.dashboardContent}>
                    {apiError && (
                        <div className={dashboardStyles.apiErrorBanner}>
                            <FiAlertCircle className={dashboardStyles.errorIcon} />
                            <p>{apiError}</p>
                            <button 
                                className={dashboardStyles.retryButton}
                                onClick={() => {
                                    setApiError(null);
                                    if (user && user._id) loadDashboardData(user._id);
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    )}


                    <div className={dashboardStyles.tabsContainer}>
                        <button
                            className={`${dashboardStyles.tabButton} ${activeTab === 'myRides' ? dashboardStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('myRides')}
                        >
                            <FiList className={dashboardStyles.tabIcon} />
                            My Rides
                        </button>
                        <button
                            className={`${dashboardStyles.tabButton} ${activeTab === 'rideRequests' ? dashboardStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('rideRequests')}
                        >
                            <FiUser className={dashboardStyles.tabIcon} />
                            Ride Requests
                        </button>
                    </div>

                    <div className={dashboardStyles.contentSection}>
                        {activeTab === 'myRides' ? (
                            /* My Rides Tab Content */
                            <>
                                {myRides.length === 0 ? (
                                    <div className={dashboardStyles.emptyState}>
                                        <FiList className={dashboardStyles.emptyStateIcon} />
                                        <p>You haven't created or accepted any rides yet</p>
                                    </div>
                                ) : (
                                    <div className={dashboardStyles.ridesContainer}>
                                        <div className={dashboardStyles.ridesHeader}>
                                            <div className={dashboardStyles.rideCol}>From</div>
                                            <div className={dashboardStyles.rideCol}>To</div>
                                            <div className={dashboardStyles.rideCol}>Date</div>
                                            <div className={dashboardStyles.rideCol}>Time</div>
                                            <div className={dashboardStyles.rideCol}>Seats</div>
                                            <div className={dashboardStyles.rideCol}>Type</div>
                                            <div className={dashboardStyles.rideCol}>Status</div>
                                            <div className={dashboardStyles.rideColSmall}>Detials</div>
                                        </div>

                                        {myRides.map((ride) => (
                                            <div key={ride._id} className={dashboardStyles.rideRow}>
                                            <div className={dashboardStyles.rideCol}>{ride.source}</div>
                                            <div className={dashboardStyles.rideCol}>{ride.destination}</div>
                                            <div className={dashboardStyles.rideCol}>{formatDate(ride.date)}</div>
                                            <div className={dashboardStyles.rideCol}>{formatTime(ride.time)}</div>
                                            <div className={dashboardStyles.rideCol}>{ride.seats || ride.availableSeats}</div>
                                            <div className={dashboardStyles.rideCol}>
                                                {ride.driver === user._id ? 'Created' : 'Accepted'}
                                            </div>
                                            <div className={dashboardStyles.rideCol}>
                                                <span className={`${dashboardStyles.statusBadge} ${getRideStatusClass(ride.status)}`}>
                                                    {ride.status || 'Pending'}
                                                </span>
                                            </div>
                                            <div className={dashboardStyles.rideColActions}>
                                                <button 
                                                    className={dashboardStyles.detailsBtn}
                                                    onClick={() => handleViewRideDetails(ride)}
                                                >
                                                    Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Ride Requests Tab Content */
                            <>
                                {rideRequests.length === 0 ? (
                                    <div className={dashboardStyles.emptyState}>
                                        <FiUser className={dashboardStyles.emptyStateIcon} />
                                        <p>No pending ride requests available</p>
                                    </div>
                                ) : (
                                    <div className={dashboardStyles.ridesContainer}>
                                        <div className={dashboardStyles.ridesHeader}>
                                            <div className={dashboardStyles.rideCol}>From</div>
                                            <div className={dashboardStyles.rideCol}>To</div>
                                            <div className={dashboardStyles.rideCol}>Date</div>
                                            <div className={dashboardStyles.rideCol}>Time</div>
                                            <div className={dashboardStyles.rideCol}>Rider</div>
                                            <div className={dashboardStyles.rideCol}>Seats</div>
                                            <div className={dashboardStyles.rideColSmall}>Action</div>
                                        </div>

                                        {rideRequests.map((request) => (
                                            <div key={request._id} className={dashboardStyles.rideRow}>
                                                <div className={dashboardStyles.rideCol}>{request.source}</div>
                                                <div className={dashboardStyles.rideCol}>{request.destination}</div>
                                                <div className={dashboardStyles.rideCol}>{formatDate(request.date)}</div>
                                                <div className={dashboardStyles.rideCol}>{formatTime(request.time)}</div>
                                                <div className={dashboardStyles.rideCol}>
                                                    {request.rider?.name || 'Unknown Rider'}
                                                </div>
                                                <div className={dashboardStyles.rideCol}>{request.seats}</div>
                                                <div className={dashboardStyles.rideColSmall}>
                                                    <button
                                                        className={dashboardStyles.acceptRideBtn}
                                                        onClick={() => handleAcceptRide(request._id)}
                                                    >
                                                        <FiCheckCircle className={dashboardStyles.actionIcon} />
                                                        Accept
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            {/* Ride Details Modal */}
            {showRideDetailsModal && selectedRide && (
                <div className={dashboardStyles.modalOverlay}>
                    <div className={dashboardStyles.modalContainer}>
                        {/* Modal Header */}
                        <div className={dashboardStyles.modalHeader}>
                            <h2 className={dashboardStyles.modalTitle}>Ride Details</h2>
                            <button 
                                className={dashboardStyles.closeButton}
                                onClick={() => setShowRideDetailsModal(false)}
                            >
                                <span className={dashboardStyles.closeIcon}>&times;</span>
                            </button>
                        </div>
                        
                        {/* Modal Content */}
                        <div className={dashboardStyles.modalContent}>
                            <div className={dashboardStyles.rideDetailsSection}>
                                <h3>Route Information</h3>
                                <div className={dashboardStyles.rideDetailRow}>
                                    <div className={dashboardStyles.rideDetailLabel}>
                                        <FiMapPin className={dashboardStyles.detailIcon} /> From:
                                    </div>
                                    <div className={dashboardStyles.rideDetailValue}>{selectedRide.source}</div>
                                </div>
                                <div className={dashboardStyles.rideDetailRow}>
                                    <div className={dashboardStyles.rideDetailLabel}>
                                        <FiMapPin className={dashboardStyles.detailIcon} /> To:
                                    </div>
                                    <div className={dashboardStyles.rideDetailValue}>{selectedRide.destination}</div>
                                </div>
                                <div className={dashboardStyles.rideDetailRow}>
                                    <div className={dashboardStyles.rideDetailLabel}>
                                        <FiCalendar className={dashboardStyles.detailIcon} /> Date:
                                    </div>
                                    <div className={dashboardStyles.rideDetailValue}>{formatDate(selectedRide.date)}</div>
                                </div>
                                <div className={dashboardStyles.rideDetailRow}>
                                    <div className={dashboardStyles.rideDetailLabel}>
                                        <FiClock className={dashboardStyles.detailIcon} /> Time:
                                    </div>
                                    <div className={dashboardStyles.rideDetailValue}>{formatTime(selectedRide.time)}</div>
                                </div>
                            </div>
                            
                            <div className={dashboardStyles.rideDetailsSection}>
                                <h3>Participants</h3>
                                {selectedRide.rider && (
                                    <div className={dashboardStyles.rideDetailRow}>
                                        <div className={dashboardStyles.rideDetailLabel}>Requester:</div>
                                        <div className={dashboardStyles.rideDetailValue}>
                                            {selectedRide.rider.name || 'Unknown'}
                                        </div>
                                    </div>
                                )}
                                
                                <div className={dashboardStyles.rideDetailRow}>
                                    <div className={dashboardStyles.rideDetailLabel}>Passengers:</div>
                                    <div className={dashboardStyles.rideDetailValue}>
                                    {selectedRide.passengers && selectedRide.passengers.length > 0 ? (
                                        <ul className={dashboardStyles.passengersList}>
                                            {selectedRide.passengers.map((passenger, index) => {
                                                const passengerName = passenger.name || `Unknown (ID: ${passenger._id})`;
                                                return (
                                                    <li key={passenger._id || `passenger-${index}`}>
                                                        {passengerName}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p>No passengers yet</p>
                                    )}
                                    </div>
                                </div>
                                
                                <div className={dashboardStyles.rideDetailRow}>
                                    <div className={dashboardStyles.rideDetailLabel}>Available Seats:</div>
                                    <div className={dashboardStyles.rideDetailValue}>{selectedRide.availableSeats || selectedRide.seats}</div>
                                </div>
                            </div>
                            
                            {selectedRide.notes && (
                                <div className={dashboardStyles.rideDetailsSection}>
                                    <h3>Additional Notes</h3>
                                    <div className={dashboardStyles.noteBox}>
                                        {selectedRide.notes}
                                    </div>
                                </div>
                            )}
                            
                            <div className={dashboardStyles.modalFooter}>
                                <button 
                                    className={dashboardStyles.secondaryButton}
                                    onClick={() => setShowRideDetailsModal(false)}
                                >
                                    Close
                                </button>
                                
                                {/* Action buttons based on ride status */}
                                {selectedRide.status !== 'Completed' && selectedRide.status !== 'Cancelled' && (
                                    <>
                                        <button 
                                            className={dashboardStyles.dangerButton}
                                            onClick={() => handleCancelRide(selectedRide._id)}
                                        >
                                            Cancel This Ride
                                        </button>
                                        
                                        {selectedRide.status === 'Confirmed' && (
                                            <button 
                                                className={dashboardStyles.primaryButton}
                                                onClick={() => handleCompleteRide(selectedRide._id)}
                                            >
                                                Mark as Completed
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}