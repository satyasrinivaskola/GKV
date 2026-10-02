import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">♥</span>
          <span>Gowda Kalyan Vedika</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register" className="nav-register">
            Register
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;