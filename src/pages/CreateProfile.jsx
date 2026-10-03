
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:4000/api/my-profile";

const emptyForm = {
  full_name: "",
  gender: "",
  date_of_birth: "",
  height: "",
  religion: "",
  caste: "",
  education: "",
  occupation: "",
  annual_income: "",
  city: "",
  about: "",
};

function CreateProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState([null, null, null]);
  const [previews, setPreviews] = useState(["", "", ""]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    async function loadProfile() {
      try {
        const response = await fetch(API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 404) {
          setIsEditing(false);
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profile");
        }

        const profile = data.profile || data;

        setForm({
          ...emptyForm,
          ...profile,
          date_of_birth: profile.date_of_birth
            ? String(profile.date_of_birth).slice(0, 10)
            : "",
        });

        setIsEditing(true);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setChecking(false);
      }
    }

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e, index) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Each photo must be smaller than 5 MB.");
      return;
    }

    const updatedPhotos = [...photos];
    updatedPhotos[index] = file;
    setPhotos(updatedPhotos);

    const updatedPreviews = [...previews];

    if (updatedPreviews[index]) {
      URL.revokeObjectURL(updatedPreviews[index]);
    }

    updatedPreviews[index] = URL.createObjectURL(file);
    setPreviews(updatedPreviews);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!["Bride", "Groom"].includes(form.gender)) {
      setMessage("Please select Bride or Groom.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(API, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save profile");
      }
const photoForm = new FormData();

photos.forEach((photo) => {
  if (photo) {
    photoForm.append("photos", photo);
  }
});

if (photos.some((photo) => photo !== null)) {
  const photoResponse = await fetch(
    "https://gkv-1g1p.onrender.com/api/my-profile/photos",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: photoForm,
    }
  );

  const photoData = await photoResponse.json();

  if (!photoResponse.ok) {
    throw new Error(
      photoData.message || "Photo upload failed"
    );
  }
}
      navigate("/Profile");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <p>Loading profile form...</p>;
  }

  return (
    <div className="profile-form-container">
      <h2>
        {isEditing
          ? "Update Your Profile"
          : "Create Your Matrimonial Profile"}
      </h2>

      <p>
        {isEditing
          ? "Edit your details and save your changes."
          : "Fill in your details to create your profile."}
      </p>

      {message && <p role="alert">{message}</p>}

      <form onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          required
        />

        <label>Gender</label>
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          required
        >
          <option value="">Select Gender</option>
          <option value="Bride">Bride</option>
          <option value="Groom">Groom</option>
        </select>

        <label>Date of Birth</label>
        <input
          type="date"
          name="date_of_birth"
          value={form.date_of_birth}
          onChange={handleChange}
          required
        />

        <label>Height</label>
        <input
          name="height"
          value={form.height}
          onChange={handleChange}
          placeholder="e.g. 5 ft 6 in"
        />

        <label>Religion</label>
        <input
          name="religion"
          value={form.religion}
          onChange={handleChange}
        />

        <label>Caste</label>
        <input
          name="caste"
          value={form.caste}
          onChange={handleChange}
        />

        <label>Education</label>
        <input
          name="education"
          value={form.education}
          onChange={handleChange}
        />

        <label>Occupation</label>
        <input
          name="occupation"
          value={form.occupation}
          onChange={handleChange}
        />

        <label>Annual Income</label>
        <input
          name="annual_income"
          value={form.annual_income}
          onChange={handleChange}
        />

        <label>City</label>
        <input
          name="city"
          value={form.city}
          onChange={handleChange}
          required
        />

        <label>About Me</label>
        <textarea
          name="about"
          value={form.about}
          onChange={handleChange}
          rows="4"
        />

        <h3>Upload Your Photos (3)</h3>
        <p>Select up to three photos. Maximum 5 MB each.</p>

        <div className="photo-upload-list">
          {photos.map((photo, index) => (
            <div key={index} className="photo-upload-item">
              <label>Photo {index + 1}</label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, index)}
              />

              {previews[index] && (
                <img
                  src={previews[index]}
                  alt={`Preview ${index + 1}`}
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    display: "block",
                    marginTop: "10px",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : isEditing
              ? "Update Profile"
              : "Create Profile"}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={() => navigate("/profiles")}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}

export default CreateProfile;