import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';

import Register from "./Register";
import Login from "./Login";
import Home from "./Home";
import VerifyEmailFailFallback from "./VerifyEmailFailFallback";
import Appointment from "./Appointment";
import PaymentSuccess from "./PaymentSuccess";
import MakeAppointment from "./MakeAppointment";
import RescheduleAppointment from "./RescheduleAppointment";
import CancelAppointment from "./CancelAppointment";
import Profile from "./Profile";
import ChangeEmailFallback from "./ChangeEmailFallback";

import StaffHome from "./staff/Home";
import VerifyEmailSuccessFallback from "./VerifyEmailSuccessFallback";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/verifyEmail/fail" element={<VerifyEmailFailFallback />} />
          <Route path="/auth/verifyEmail/success" element={<VerifyEmailSuccessFallback />} />
          <Route path="/" element={<Home />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="makeAppointment" element={<MakeAppointment />} />
          <Route path="/rescheduleAppointment" element={<RescheduleAppointment />} />
          <Route path="/cancelAppointment" element={<CancelAppointment />} />
          <Route path="/stripe/paymentSuccess" element={<PaymentSuccess />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth/login/changeEmailFallback" element={<ChangeEmailFallback />} />

          <Route path="/staff" element={<StaffHome />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
