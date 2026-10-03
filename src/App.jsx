
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Profile from "./pages/Profiles";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileDetails from "./pages/ProfileDetails";
import CreateProfile from "./pages/CreateProfile";
import MyProfile from "./pages/MyProfile";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/Profile" element={<Profile />} />

            <Route path="/profile/:id" element={<ProfileDetails />} />
            <Route path="/create-profile" element={<CreateProfile />} />
            <Route path="/my-profile" element={<MyProfile />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;