
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function MyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:4000/api/my-profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();

        if (res.status === 404) {
          navigate("/create-profile");
          return null;
        }

        if (!res.ok) {
          throw new Error(data.message || "Failed to load profile");
        }

        return data.profile || data;
      })
      .then((data) => {
        if (data) setProfile(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p>{error}</p>;
  if (!profile) return null;

  return (
    <div className="profile-form-container">
      <h2>My Profile</h2>
      <p><strong>Name:</strong> {profile.full_name}</p>
      <p><strong>Gender:</strong> {profile.gender}</p>
      <p><strong>Date of Birth:</strong> {String(profile.date_of_birth).slice(0, 10)}</p>
      <p><strong>Height:</strong> {profile.height}</p>
      <p><strong>Religion:</strong> {profile.religion}</p>
      <p><strong>Caste:</strong> {profile.caste}</p>
      <p><strong>Education:</strong> {profile.education}</p>
      <p><strong>Occupation:</strong> {profile.occupation}</p>
      <p><strong>Annual Income:</strong> {profile.annual_income}</p>
      <p><strong>City:</strong> {profile.city}</p>
      <p><strong>About:</strong> {profile.about}</p>

      <button onClick={() => navigate("/create-profile")}>
        Update Profile
      </button>
    </div>
  );
}

export default MyProfile;