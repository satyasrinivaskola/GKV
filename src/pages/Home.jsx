import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileCard from "../components/ProfileCard";
import matchImage from "./images/img.png";
const API_URL = "http://localhost:4000/api";

function Home() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/profiles`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load profiles.");
        }
        return response.json();
      })
      .then((data) => setProfiles(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">♥ Your journey starts here</span>
          <h1>Find Your <span>Perfect Match</span></h1>
          <p>
            A meaningful connection begins with the right introduction.
            Discover matrimonial profiles and take the first step.
          </p>
          <div className="hero-actions">
            <Link to="/search" className="button button-white">
              Explore Profiles
            </Link>
            <Link to="/register" className="button button-outline">
              Create Your Profile
            </Link>
          </div>
        </div>
    <div className="hero-decoration">
  <img
    src={matchImage}
    alt="Gowda Kalyan Vedika match profiles"
    className="match-collage"
  />
</div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Discover connections</span>
            <h2>Recently Published Profiles</h2>
            <p>Explore profiles shared by our members.</p>
          </div>
          <Link to="/search" className="text-link">
            View all profiles →
          </Link>
        </div>

        {loading && <div className="status-box">Loading profiles...</div>}

        {error && (
          <div className="status-box error">
            {error}
            <p>Check that your backend is running on port 4000.</p>
          </div>
        )}

        {!loading && !error && profiles.length === 0 && (
          <div className="status-box">
            No published profiles are available yet.
          </div>
        )}

        {!loading && !error && profiles.length > 0 && (
          <div className="profile-grid">
            {profiles.slice(0, 6).map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </section>

      <section className="join-section">
        <div>
          <span className="eyebrow">Start your journey</span>
          <h2>Your story deserves a beautiful beginning.</h2>
          <p>Create your profile and introduce yourself to potential matches.</p>
        </div>
        <Link to="/register" className="button button-primary">
          Register Now
        </Link>
      </section>
    </div>
  );
}

export default Home;