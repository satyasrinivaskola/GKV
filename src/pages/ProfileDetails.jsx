
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = "https://gkv-1g1p.onrender.com";

function ProfileDetails() {
const fetchContact = async (token) => {
  const response = await fetch(
    `https://gkv-1g1p.onrender.com/api/profiles/${id}/contact`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to get contact");
  }

  setPhone(data.phone);
};

const handleCheckContact = async () => {
  const token = localStorage.getItem("token");

  setContactLoading(true);
  setContactMessage("");

  try {
    // Create ₹500 payment order
    const orderResponse = await fetch(
      "https://gkv-1g1p.onrender.com/api/payments/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile_id: profile.id,
        }),
      }
    );

    const order = await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error(order.message || "Unable to create order");
    }

    // Already paid? Fetch contact directly
    if (order.alreadyPaid) {
      await fetchContact(token);
      return;
    }

    // Open Razorpay Checkout
    const options = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: "Gowda Kalyan Vedika",
      description: "View Contact Details",
      order_id: order.order_id,

      handler: async function (paymentResponse) {
        try {
          const verifyResponse = await fetch(
            "https://gkv-1g1p.onrender.com/api/payments/verify",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(paymentResponse),
            }
          );

          const result = await verifyResponse.json();

          if (!verifyResponse.ok) {
            throw new Error(result.message || "Payment verification failed");
          }

          await fetchContact(token);
        } catch (error) {
          setContactMessage(error.message);
        }
      },

      modal: {
        ondismiss: () => {
          setContactMessage("Payment was cancelled.");
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    setContactMessage(error.message);
  } finally {
    setContactLoading(false);
  }
};
  const { id } = useParams();
  const [phone, setPhone] = useState("");
const [contactMessage, setContactMessage] = useState("");
const [contactLoading, setContactLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`${API}/api/profiles/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

      const text = await response.text();
console.log("API response:", response.status, text);

let data;
try {
  data = JSON.parse(text);
} catch {
  throw new Error(
    `Server returned HTML instead of JSON. Status: ${response.status}`
  );
}

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profile");
        }

        setProfile(data.profile);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p>{error}</p>;
  if (!profile) return <p>Profile not found.</p>;

  const age = profile.date_of_birth
    ? Math.floor(
        (new Date() - new Date(profile.date_of_birth)) /
        (365.2425 * 24 * 60 * 60 * 1000)
      )
    : "N/A";

  return (
    <div className="profile-details-page">
      <h1>{profile.full_name}</h1>

      <div className="profile-photos">
        {profile.photos?.length ? (
          profile.photos.slice(0, 3).map((photo, index) => (
            <img
              key={index}
              src={`${API}${photo}`}
              alt={`${profile.full_name} ${index + 1}`}
            />
          ))
        ) : (
          <p>No photos uploaded</p>
        )}
      </div>

      <section className="profile-details">
        <h2>Personal Details</h2>
        <p><strong>Age:</strong> {age}</p>
        <p><strong>Gender:</strong> {profile.gender}</p>
        <p><strong>Height:</strong> {profile.height || "Not provided"}</p>
        <p><strong>Religion:</strong> {profile.religion || "Not provided"}</p>
        <p><strong>Caste:</strong> {profile.caste || "Not provided"}</p>
        <p><strong>City:</strong> {profile.city || "Not provided"}</p>
      </section>

      <section className="profile-details">
        <h2>Education & Career</h2>
        <p><strong>Education:</strong> {profile.education || "Not provided"}</p>
        <p><strong>Occupation:</strong> {profile.occupation || "Not provided"}</p>
        <p><strong>Annual Income:</strong> {profile.annual_income || "Not provided"}</p>
      </section>

      <section className="profile-details">
        <h2>About</h2>
        <p>{profile.about || "No description provided."}</p>
      </section>

     <section className="contact-section">
  <h2>Contact Details</h2>

  {phone ? (
    <p>
      <strong>Phone number:</strong> {phone}
    </p>
  ) : (
    <p>Phone number: **********</p>
  )}

  <button
    onClick={handleCheckContact}
    disabled={contactLoading || !!phone}
  >
    {contactLoading
      ? "Checking..."
      : phone
      ? "Contact Unlocked"
      : "Check Contact"}
  </button>

  {contactMessage && <p>{contactMessage}</p>}
</section>
    </div>
  );
}

export default ProfileDetails;