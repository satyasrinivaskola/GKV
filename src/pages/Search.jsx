import { useEffect, useMemo, useState } from "react";
import ProfileCard from "../components/ProfileCard";

const API_URL = "https://gkv-1g1p.onrender.com/api";

function Search() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [education, setEducation] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/profiles`)
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load profiles.");
        return response.json();
      })
      .then(setProfiles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesCity = (profile.city || "")
        .toLowerCase()
        .includes(city.toLowerCase());

      const matchesGender =
        !gender ||
        (profile.gender || "").toLowerCase() === gender.toLowerCase();

      const matchesEducation = (profile.education || "")
        .toLowerCase()
        .includes(education.toLowerCase());

      return matchesCity && matchesGender && matchesEducation;
    });
  }, [profiles, city, gender, education]);

  return (
    <section className="section search-page">
      <div className="page-heading">
        <span className="eyebrow">Find your connection</span>
        <h1>Search Matrimonial Profiles</h1>
        <p>Filter profiles by location, gender and education.</p>
      </div>

      <div className="search-panel">
        <div className="field">
          <label htmlFor="city">City</label>
          <input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city"
          />
        </div>

        <div className="field">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">All</option>
         <option value="Bride">Bride</option>
<option value="Groom">Groom</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="education">Education</label>
          <input
            id="education"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="e.g. B.Tech"
          />
        </div>

        <button
          className="button button-primary"
          onClick={() => {
            setCity("");
            setGender("");
            setEducation("");
          }}
        >
          Clear Filters
        </button>
      </div>

      <p className="result-count">
        {loading ? "Loading..." : `${filteredProfiles.length} profiles found`}
      </p>

      {error && <div className="status-box error">{error}</div>}

      {!loading && !error && filteredProfiles.length === 0 && (
        <div className="status-box">No profiles match your search.</div>
      )}

      <div className="profile-grid">
        {filteredProfiles.map((profile) => (
          <ProfileCard key={profile.id} profile={profile} />
        ))}
      </div>
    </section>
  );
}

export default Search;