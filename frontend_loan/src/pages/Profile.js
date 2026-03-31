import React, { useEffect, useState } from "react";
import axios from "axios";

function Profile() {
    const [user, setUser] = useState(null);
    const [loans, setLoans] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [passwordMode, setPasswordMode] = useState(false);
    const [photo, setPhoto] = useState(null);

    const token = localStorage.getItem("token");

    // Fetch Profile Data
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(
                "http://localhost:5001/api/auth/profile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUser(res.data.user);
            setLoans(res.data.loans);
        } catch (error) {
            console.error("Profile fetch error:", error);
        }
    };

    // Update Profile
    const handleUpdateProfile = async () => {
        try {
            await axios.put(
                "http://localhost:5001/api/auth/profile",
                {
                    username: user.username,
                    mobile: user.mobile,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            alert("Profile updated successfully");
            setEditMode(false);
        } catch (error) {
            alert("Update failed");
        }
    };

    // Change Password
    const handleChangePassword = async (e) => {
        e.preventDefault();

        const currentPassword = e.target.currentPassword.value;
        const newPassword = e.target.newPassword.value;

        try {
            await axios.put(
                "http://localhost:5001/api/auth/change-password",
                { currentPassword, newPassword },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            alert("Password changed successfully");
            setPasswordMode(false);
            e.target.reset();
        } catch (error) {
            alert("Password change failed");
        }
    };

    // Upload Photo
    const handlePhotoUpload = async () => {
        if (!photo) return;

        const formData = new FormData();
        formData.append("photo", photo);

        try {
            await axios.put(
                "http://localhost:5001/api/auth/upload-photo",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            alert("Photo updated successfully");
            fetchProfile();
        } catch (error) {
            alert("Upload failed");
        }
    };

    if (!user) return <div className="text-center mt-5">Loading...</div>;

    return (
        <div className="container mt-4">
            <div className="card p-4 shadow">

                <h2 className="mb-4 text-success">My Profile</h2>

                {/* Profile Photo */}
                <div className="text-center mb-3">
                    <img
                        src={
                            user.profilePhoto
                                ? `http://localhost:5001/${user.profilePhoto}`
                                : "https://via.placeholder.com/120"
                        }
                        alt="Profile"
                        width="120"
                        height="120"
                        className="rounded-circle"
                    />
                    <div className="mt-2">
                        <input
                            type="file"
                            onChange={(e) => setPhoto(e.target.files[0])}
                        />
                        <button
                            className="btn btn-success btn-sm mt-2"
                            onClick={handlePhotoUpload}
                        >
                            Upload Photo
                        </button>
                    </div>
                </div>

                {/* Registration Details */}
                <p><strong>Email:</strong> {user.email}</p>

                {editMode ? (
                    <>
                        <input
                            type="text"
                            value={user.username || ""}
                            onChange={(e) =>
                                setUser({ ...user, username: e.target.value })
                            }
                            className="form-control mb-2"
                            placeholder="Username"
                        />

                        <input
                            type="text"
                            value={user.mobile || ""}
                            onChange={(e) =>
                                setUser({ ...user, mobile: e.target.value })
                            }
                            className="form-control mb-2"
                            placeholder="Mobile"
                        />

                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleUpdateProfile}
                        >
                            Save
                        </button>

                        <button
                            className="btn btn-secondary btn-sm ms-2"
                            onClick={() => setEditMode(false)}
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Mobile:</strong> {user.mobile}</p>

                        <button
                            className="btn btn-warning btn-sm"
                            onClick={() => setEditMode(true)}
                        >
                            Edit Profile
                        </button>
                    </>
                )}

                {/* Change Password */}
                <div className="mt-4">
                    {passwordMode ? (
                        <form onSubmit={handleChangePassword}>
                            <input
                                type="password"
                                name="currentPassword"
                                placeholder="Current Password"
                                className="form-control mb-2"
                                required
                            />
                            <input
                                type="password"
                                name="newPassword"
                                placeholder="New Password"
                                className="form-control mb-2"
                                required
                            />
                            <button className="btn btn-danger btn-sm">
                                Change Password
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm ms-2"
                                onClick={() => setPasswordMode(false)}
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => setPasswordMode(true)}
                        >
                            Change Password
                        </button>
                    )}
                </div>

                {/* Loan History */}
                <div className="mt-5">
                    <h4>Loan History</h4>

                    {loans.length === 0 ? (
                        <p>You have not applied for any loans yet.</p>
                    ) : (
                        <table className="table table-bordered mt-3">
                            <thead>
                                <tr>
                                    <th>Requested</th>
                                    <th>Approved</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loans.map((loan) => (
                                    <tr key={loan._id}>
                                        <td>₹{loan.loanAmount}</td>
                                        <td>₹{loan.approvedAmount}</td>
                                        <td>{loan.status}</td>
                                        <td>
                                            {new Date(loan.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    );
}

export default Profile;
