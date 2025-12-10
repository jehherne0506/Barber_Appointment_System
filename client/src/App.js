import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';

import Register from "./Register";
import Login from "./Login";
import VerifyEmailFailFallback from "./VerifyEmailFailFallback";
import Appointment from "./Appointment";
import PaymentSuccess from "./PaymentSuccess";

import StaffHome from "./staff/Home";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/verifyEmail/fail" element={<VerifyEmailFailFallback />} />
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/stripe/paymentSuccess" element={<PaymentSuccess />} />

          <Route path="/staff" element={<StaffHome />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
