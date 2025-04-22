'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { RiLogoutBoxLine, RiUserLine } from "react-icons/ri";
import { FiAlertCircle, FiList, FiPlus, FiClock, FiMapPin, FiCalendar } from "react-icons/fi";
import { MdDirectionsCar } from "react-icons/md";
import styles from '@/styles/Auth.module.css';
import dashboardStyles from '@/styles/Dashboard.module.css';
import connectToDatabase from '@/lib/mongodb';

export default function RiderDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('availableRides');
    const [availableRides, setAvailableRides] = useState([]);
    const [myRides, setMyRides] = useState([]);
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
        const fetchUserData = async () => {
            try {
                // Check for user in localStorage
                const userStr = localStorage.getItem('rideshareUser');
                if (!userStr) {
                    console.error("No user data found in localStorage");
                    setLoading(false);
                    return;
                }
                
                const userData = JSON.parse(userStr);
                if (!userData || !userData._id) {
                    console.log("No valid user session found");
                    setLoading(false);
                    return;
                }
    
                console.log("User ID found in localStorage:", userData._id);
                setUser(userData);
                
                // Fetch available rides and user's rides
                try {
                    await fetchAvailableRides();
                } catch (err) {
                    console.error("Error fetching available rides:", err);
                    setApiError("Could not load available rides. Please try again later.");
                }
                
                // Only fetch my rides if we have a valid user ID
                if (userData._id) {
                    try {
                        console.log("Calling fetchMyRides with ID:", userData._id);
                        await fetchMyRides(userData._id);
                    } catch (err) {
                        console.error("Error fetching my rides:", err);
                        setApiError("Could not load your rides. Please try again later.");
                    }
                } else {
                    console.error("Cannot fetch user rides: No valid user ID found");
                }
                
                setLoading(false);
            } catch (err) {
                console.error("Error loading rider dashboard:", err);
                setApiError("Error loading dashboard. Please try again later.");
                setLoading(false);
            }
        };
    
        fetchUserData();
    }, []);

    // Handle closing dropdown and modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const modal = document.getElementById("create-ride-modal");
            if (showRideModal && modal && !modal.contains(event.target)) {
                setShowRideModal(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showRideModal]);

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                if (showRideModal) setShowRideModal(false);
                if (showProfileDropdown) setShowProfileDropdown(false);
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [showRideModal, showProfileDropdown]);

    const fetchAvailableRides = async () => {
        try {
          console.log("Fetching available rides...");
      
          const response = await fetch('/api/rides/available'); // Make sure this matches your route
          console.log("Available rides response status:", response.status);
      
          if (!response.ok) {
            let errorMessage;
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || `Server responded with status: ${response.status}`;
            } catch (parseError) {
              errorMessage = `Server responded with status: ${response.status}`;
            }
      
            throw new Error(errorMessage);
          }
      
          const data = await response.json();
          console.log("Available rides data:", data);
      
          if (data.success && data.rides) {
            const filteredRides = data.rides.filter(ride => ride.status !== 'Cancelled');
      
            if (filteredRides.length > 0) {
              setAvailableRides(filteredRides);
            } else {
              console.warn("No available rides after filtering out cancelled ones.");
              setAvailableRides([]);
            }
          } else {
            console.warn("API returned success: false or no rides", data);
            setAvailableRides([]);
          }
        } catch (err) {
          console.error("Error fetching available rides:", err);
          setAvailableRides([]);
          throw err;
        }
      };      
    
    
    const fetchMyRides = async (userId) => {
        try {
            // Add validation - make sure userId exists and is valid
            if (!userId) {
                console.error("No valid user ID available");
                setMyRides([]);
                return; // Exit early instead of throwing an error
            }
            
            console.log(`Fetching rides for rider ID: ${userId}`);
            const fetchUrl = `/api/rides/rider/${userId}`;
            console.log("Fetch URL:", fetchUrl);
            const response = await fetch(fetchUrl);
            
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
            console.error("Error fetching rider rides:", err);
            setMyRides([]);
            // Don't rethrow the error to prevent crashing the component
        }
    };

    const handleLogout = () => {
        // Clear user session data
        localStorage.removeItem('rideshareToken');
        localStorage.removeItem('rideshareUser');
        // Redirect to login page
        router.replace('/login');
    };

    const navigateToProfile = () => {
        router.push('/profile');
        setShowProfileDropdown(false);
    };

    const handleViewRideDetails = (ride) => {
        setSelectedRide(ride);
        setShowRideDetailsModal(true);
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
        // Format based on what's stored in the database
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
    // Handle leave ride function
    const handleLeaveRide = async (rideId) => {
        try {
            // Add validation to ensure rideId exists and is valid
            if (!rideId) {
                alert('Ride ID is missing. Cannot leave ride.');
                return;
            }
    
            if (!user || !user._id) {
                alert('User information missing. Please try logging in again.');
                return;
            }
    
            console.log(`Leaving ride with ID: ${rideId}`); // Debugging
    
            // Make sure the endpoint URL is correctly formatted
            const response = await fetch(`/api/rides/leave/${rideId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('rideshareToken')}`
                },
                body: JSON.stringify({
                    userId: user._id
                })
            });
    
            // Debug response
            console.log("Leave ride response status:", response.status);
    
            // Check if the response is valid JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text();
                console.error(`Server returned non-JSON response:`, textResponse);
                throw new Error(`Server returned non-JSON response: ${textResponse}`);
            }
    
            const data = await response.json();
            console.log("Leave ride response data:", data);
    
            if (!response.ok) {
                throw new Error(data.message || 'Failed to leave ride');
            }
    
            // Update rides lists
            await fetchAvailableRides();
            await fetchMyRides(user._id);
    
            // Close the modal and show success message
            setShowRideDetailsModal(false);
            alert('Successfully left the ride');
    
        } catch (err) {
            console.error("Error leaving ride:", err);
            alert(err.message || 'Failed to leave ride');
        }
    };
    

// Handle cancel ride function
const handleCancelRide = async (rideId) => {
    try {
        // Add validation to ensure rideId exists and is valid
        if (!rideId) {
            alert('Ride ID is missing. Cannot cancel ride.');
            return;
        }
        
        if (!user || !user._id) {
            alert('User information missing. Please try logging in again.');
            return;
        }
        
        console.log(`Cancelling ride with ID: ${rideId}`); // Add this for debugging
        
        // Make sure the endpoint URL is correctly formatted
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
        
        // Debug response
        console.log("Cancel ride response status:", response.status);
        
        // Check if the response is valid JSON
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
        
        // Update rides lists
        await fetchMyRides(user._id);
        
        // Close the modal and show success message
        setShowRideDetailsModal(false);
        alert('Ride cancelled successfully');
        
    } catch (err) {
        console.error("Error canceling ride:", err);
        alert(err.message || 'Failed to cancel ride');
    }
};
    
    async function submitNewRide(rideData) {
        const response = await fetch('/api/rides/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rideData),
        });
        
        if (!response.ok) {
          // Handle error response
          const contentType = response.headers.get('Content-Type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create ride');
          } else {
            // Handle non-JSON response
            const text = await response.text();
            console.error('Received non-JSON response:', text);
            throw new Error('Unexpected response from server');
          }
        }
        
        return response.json();
      }
    
    const handleJoinRide = async (rideId) => {
        try {
            const response = await fetch(`/api/rides/join/${rideId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('rideshareToken')}`
                },
                body: JSON.stringify({
                    userId: user._id
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to join ride');
            }
            
            // Update rides lists
            try {
                await fetchAvailableRides();
                await fetchMyRides(user._id);
            } catch (error) {
                console.error("Failed to refresh rides after joining:", error);
            }
            
            // Show success message
            alert('Successfully joined the ride');
            
        } catch (err) {
            console.error("Error joining ride:", err);
            alert(err.message || 'Failed to join ride');
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

    // Add this function to your component
const handleSubmit = async (e) => {
    e.preventDefault(); // This prevents the default form submission
    
    try {
        setError('');
        
        // Make sure to include the user ID as the rider
        const rideData = {
            ...newRide,
            rider: user._id
        };
        
        const result = await submitNewRide(rideData);
        
        if (result.success) {
            // Close the modal
            setShowRideModal(false);
            
            // Refresh both ride lists
            await fetchAvailableRides();
            await fetchMyRides(user._id);
            
            // Provide feedback
            alert('Ride request created successfully!');
        } else {
            setError(result.message || 'Failed to create ride');
        }
    } catch (err) {
        console.error('Error creating ride:', err);
        setError(err.message || 'An error occurred while creating the ride');
    }
};

    // Show login screen if no user found
    if (!loading && !user) {
        return (
            <div className={dashboardStyles.container}>
                <Head><title>Rideshare | Login Required</title></Head>
                <div className={dashboardStyles.accessDenied}>
                    <h1>Login Required</h1>
                    <p>Please log in to access your rider dashboard.</p>
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
            <Head><title>Rideshare | Rider Dashboard</title></Head>

            <div className={dashboardStyles.dashboardContainer}>
                <div className={dashboardStyles.headerBar}>
                    <div className={dashboardStyles.headerSection}>
                        <h1 className={styles.title}>Rider Dashboard</h1>
                        <p className={styles.subtitle}>
                            {loading ? 'Loading your profile...' : `Welcome, ${user?.name || 'Rider'}`}
                        </p>
                    </div>
                    
                    <div className={dashboardStyles.profileSection}>
                        <div 
                            className={dashboardStyles.profileButton}
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        >
                            <div className={dashboardStyles.profileAvatar}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
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

                    {/* Action Bar with Create Ride Button */}
                    <div className={dashboardStyles.actionBar}>
                        <button 
                            className={dashboardStyles.createRideButton}
                            onClick={handleCreateRide}
                        >
                            <FiPlus className={dashboardStyles.actionIcon} />
                            Create New Ride Request
                        </button>
                    </div>

                    {/* Tabs for navigation */}
                    <div className={dashboardStyles.tabsContainer}>
                        <button
                            className={`${dashboardStyles.tabButton} ${activeTab === 'availableRides' ? dashboardStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('availableRides')}
                        >
                            <MdDirectionsCar className={dashboardStyles.tabIcon} />
                            Available Rides
                        </button>
                        <button
                            className={`${dashboardStyles.tabButton} ${activeTab === 'myRides' ? dashboardStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('myRides')}
                        >
                            <FiList className={dashboardStyles.tabIcon} />
                            My Rides
                        </button>
                    </div>

                    <div className={dashboardStyles.contentSection}>
                        {loading ? (
                            <div className={dashboardStyles.loadingState}>
                                <p>Loading rides...</p>
                            </div>
                        ) : activeTab === 'availableRides' ? (
                            /* Available Rides Tab Content */
                            <>
                                {availableRides.length === 0 ? (
                                    <div className={dashboardStyles.emptyState}>
                                        <MdDirectionsCar className={dashboardStyles.emptyStateIcon} />
                                        <p>No available rides found</p>
                                    </div>
                                ) : (
                                    <div className={dashboardStyles.ridesContainer}>
                                        <div className={dashboardStyles.ridesHeader}>
                                            <div className={dashboardStyles.rideCol}>From</div>
                                            <div className={dashboardStyles.rideCol}>To</div>
                                            <div className={dashboardStyles.rideCol}>Date</div>
                                            <div className={dashboardStyles.rideCol}>Time</div>
                                            <div className={dashboardStyles.rideCol}>Driver</div>
                                            <div className={dashboardStyles.rideCol}>Seats</div>
                                            <div className={dashboardStyles.rideColSmall}>Action</div>
                                        </div>
                                        
                                        {availableRides.map((ride) => (
                                            <div key={ride._id} className={dashboardStyles.rideRow}>
                                            <div className={dashboardStyles.rideCol}>{ride.source}</div>
                                            <div className={dashboardStyles.rideCol}>{ride.destination}</div>
                                            <div className={dashboardStyles.rideCol}>{formatDate(ride.date)}</div>
                                            <div className={dashboardStyles.rideCol}>{formatTime(ride.time)}</div>
                                            <div className={dashboardStyles.rideCol}>{ride.driver?.name || 'Unknown'}</div>
                                            <div className={dashboardStyles.rideCol}>{ride.availableSeats}</div>
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
                            /* My Rides Tab Content */
                            <>
                                {myRides.length === 0 ? (
                                    <div className={dashboardStyles.emptyState}>
                                        <FiList className={dashboardStyles.emptyStateIcon} />
                                        <p>You haven't created or joined any rides yet</p>
                                    </div>
                                ) : (
                                    <div className={dashboardStyles.ridesContainer}>
                                        <div className={dashboardStyles.ridesHeader}>
                                            <div className={dashboardStyles.rideCol}>From</div>
                                            <div className={dashboardStyles.rideCol}>To</div>
                                            <div className={dashboardStyles.rideCol}>Date</div>
                                            <div className={dashboardStyles.rideCol}>Time</div>
                                            <div className={dashboardStyles.rideCol}>Type</div>
                                            <div className={dashboardStyles.rideCol}>Status</div>
                                        </div>
                                        
                                        {myRides.map((ride) => (
                                        <div key={ride._id} className={dashboardStyles.rideRow}>
                                            <div className={dashboardStyles.rideCol}>{ride.source}</div>
                                            <div className={dashboardStyles.rideCol}>{ride.destination}</div>
                                            <div className={dashboardStyles.rideCol}>{formatDate(ride.date)}</div>
                                            <div className={dashboardStyles.rideCol}>{formatTime(ride.time)}</div>
                                            <div className={dashboardStyles.rideCol}>
                                                {ride.rider === user?._id ? 'Created by me' : 'Joined'}
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
                        )}
                    </div>
                </div>
            </div>
            
            {/* Create Ride Modal */}
            {showRideModal && (
                <div className={dashboardStyles.modalOverlay}>
                    <div 
                        id="create-ride-modal" 
                        className={dashboardStyles.modalContainer}
                    >
                        {/* Modal Header */}
                        <div className={dashboardStyles.modalHeader}>
                            <h2 className={dashboardStyles.modalTitle}>Create Ride Request</h2>
                            <button 
                                className={dashboardStyles.closeButton}
                                onClick={() => setShowRideModal(false)}
                            >
                                <span className={dashboardStyles.closeIcon}>&times;</span>
                            </button>
                        </div>
                        
                        {/* Modal Content */}
                        <div className={dashboardStyles.modalContent}>
                            <form onSubmit={handleSubmit}>
                                {error && <div className={dashboardStyles.errorMessage}>{error}</div>}
                                
                                <div className={dashboardStyles.formRow}>
                                    <div className={dashboardStyles.formGroup}>
                                        <label htmlFor="source" className={dashboardStyles.formLabel}>
                                            <FiMapPin className={dashboardStyles.formIcon} />
                                            Pickup Location
                                        </label>
                                        <input 
                                            type="text" 
                                            id="source" 
                                            name="source"
                                            className={dashboardStyles.formInput}
                                            value={newRide.source}
                                            onChange={handleInputChange}
                                            placeholder="Enter pickup location"
                                            required
                                        />
                                    </div>
                                    
                                    <div className={dashboardStyles.formGroup}>
                                        <label htmlFor="destination" className={dashboardStyles.formLabel}>
                                            <FiMapPin className={dashboardStyles.formIcon} />
                                            Destination
                                        </label>
                                        <input 
                                            type="text" 
                                            id="destination" 
                                            name="destination"
                                            className={dashboardStyles.formInput}
                                            value={newRide.destination}
                                            onChange={handleInputChange}
                                            placeholder="Enter destination"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className={dashboardStyles.formRow}>
                                    <div className={dashboardStyles.formGroup}>
                                        <label htmlFor="date" className={dashboardStyles.formLabel}>
                                            <FiCalendar className={dashboardStyles.formIcon} />
                                            Date
                                        </label>
                                        <input 
                                            type="date" 
                                            id="date" 
                                            name="date"
                                            className={dashboardStyles.formInput}
                                            value={newRide.date}
                                            onChange={handleInputChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    
                                    <div className={dashboardStyles.formGroup}>
                                        <label htmlFor="time" className={dashboardStyles.formLabel}>
                                            <FiClock className={dashboardStyles.formIcon} />
                                            Time
                                        </label>
                                        <input 
                                            type="time" 
                                            id="time" 
                                            name="time"
                                            className={dashboardStyles.formInput}
                                            value={newRide.time}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className={dashboardStyles.formRow}>
                                    <div className={dashboardStyles.formGroup}>
                                        <label htmlFor="seats" className={dashboardStyles.formLabel}>
                                            Seats Needed
                                        </label>
                                        <select 
                                            id="seats" 
                                            name="seats"
                                            className={dashboardStyles.formSelect}
                                            value={newRide.seats}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="1">1 seat</option>
                                            <option value="2">2 seats</option>
                                            <option value="3">3 seats</option>
                                            <option value="4">4 seats</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className={dashboardStyles.formGroup}>
                                    <label htmlFor="notes" className={dashboardStyles.formLabel}>
                                        Additional Notes
                                    </label>
                                    <textarea 
                                        id="notes" 
                                        name="notes"
                                        className={dashboardStyles.formTextarea}
                                        value={newRide.notes}
                                        onChange={handleInputChange}
                                        placeholder="Any additional information for the driver"
                                        rows="3"
                                    />
                                </div>
                                
                                <div className={dashboardStyles.modalFooter}>
                                    <button 
                                        type="button"
                                        className={dashboardStyles.secondaryButton}
                                        onClick={() => setShowRideModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className={dashboardStyles.primaryButton}
                                    >
                                        Create Ride Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

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
                                <div className={dashboardStyles.rideDetailRow}>
                                    <div className={dashboardStyles.rideDetailLabel}>Driver:</div>
                                    <div className={dashboardStyles.rideDetailValue}>
                                        {selectedRide.driver?.name || 'Not assigned yet'}
                                    </div>
                                </div>
                                
                                <div className={dashboardStyles.rideDetailRow}>
                                    <div className={dashboardStyles.rideDetailLabel}>Passengers:</div>
                                    <div className={dashboardStyles.rideDetailValue}>
                                    {selectedRide.passengers && selectedRide.passengers.length > 0 ? (
                                    <ul className={dashboardStyles.passengersList}>
                                        {selectedRide.passengers.map((passenger, index) => {
                                        const passengerName = passenger.name || `Unknown (ID: ${passenger._id})`;

                                        return (
                                            <li key={passenger._id || `passenger-${index}`}>
                                            {passengerName} {passenger._id === user?._id && '(You)'}
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
                                    <div className={dashboardStyles.rideDetailValue}>{selectedRide.availableSeats}</div>
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
                                
                                {/* Show different action buttons based on ride relationship */}
                                {activeTab === 'availableRides' ? (
                                // For available rides tab, check if the user is a passenger or not
                                selectedRide.passengers && selectedRide.passengers.some(passenger => passenger._id === user?._id) ? (
                                    // If the user is already a passenger, show the 'Leave' button
                                    <button 
                                    className={dashboardStyles.warningButton}
                                    onClick={() => handleLeaveRide(selectedRide._id)}
                                    >
                                    Leave This Ride
                                    </button>
                                ) : (
                                    // If the user is not a passenger, show the 'Join' button
                                    <button 
                                    className={dashboardStyles.primaryButton}
                                    onClick={() => handleJoinRide(selectedRide._id)}
                                    >
                                    Join This Ride
                                    </button>
                                )
                                ) : activeTab === 'myRides' && selectedRide.status !== 'Cancelled' ? (
                                // For my rides tab, if the ride is not cancelled, show the 'Cancel' button
                                <button 
                                    className={dashboardStyles.dangerButton}
                                    onClick={() => handleCancelRide(selectedRide._id)}
                                >
                                    Cancel This Ride
                                </button>
                                ) : null}

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}