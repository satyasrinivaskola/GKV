
import { Link } from "react-router-dom";

function ProfileCard({ profile }) {
  const age = profile.date_of_birth
    ? Math.floor(
        (new Date() - new Date(profile.date_of_birth)) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <article className="profile-card">
      <div className="profile-photo">
        <div className="photo-placeholder">
          {profile.gender === "Bride" ? "👩" : "👨"}
        </div>
        <span className="profile-badge">Profile</span>
      </div>

      <div className="profile-content">
        <h3>{profile.full_name || "Member"}</h3>

        <p className="profile-meta">
          {age !== null && age >= 0
            ? `${age} years`
            : "Age not provided"}
          {profile.gender ? ` · ${profile.gender}` : ""}
        </p>

        <div className="profile-info">
          <p>♧ {profile.height || "Height not provided"}</p>
          <p>✦ {profile.education || "Education not provided"}</p>
          <p>⌂ {profile.occupation || "Occupation not provided"}</p>
          <p>⌖ {profile.city || "Location not provided"}</p>
        </div>

        <p className="profile-about">
          {profile.about || "No introduction available."}
        </p>

        <Link
          to={`/profile/${profile.id}`}
          className="button button-primary"
        >
          View Profile
        </Link>
      </div>
    </article>
  );
}

export default ProfileCard;