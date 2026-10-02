
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:4000";

function Profile() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in to view profiles.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API}/api/profiles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profiles");
        }

        setProfiles(data.profiles || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  if (loading) return <p>Loading profiles...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="profiles-page">
      <h1>Registered Profiles</h1>

      {profiles.length === 0 ? (
        <p>No other profiles available yet.</p>
      ) : (
        <div className="profiles-grid">
          {profiles.map((profile) => {
            const age = profile.date_of_birth
              ? new Date().getFullYear() -
                new Date(profile.date_of_birth).getFullYear()
              : "N/A";

            const photo = profile.photos?.[0];

            return (
              <div className="profile-card" key={profile.id}>
                {photo ? (
                  <img
                    src={`${API}${photo}`}
                    alt={profile.full_name}
                    className="profile-photo"
                  />
                ) : (
                  <div className="no-photo">No Photo</div>
                )}

                <div className="profile-info">
                  <h2>{profile.full_name}</h2>
                  <p>{age} years · {profile.gender}</p>
                  <p>{profile.city || "Location not provided"}</p>
                  <p>{profile.education || "Education not provided"}</p>
                  <p>{profile.occupation || "Occupation not provided"}</p>

                  <Link to={`/profile/${profile.id}`}>
                    View Profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Profile;