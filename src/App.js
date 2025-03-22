import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from "./components/HomePage";  
import HotelBooking from './components/HotelBooking';
import Accommodation from './components/Accommodation';
import Register from './components/Register';
import PaymentPage from './components/PaymentPage';
import Login from './components/Login';
import './App.css';
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<HotelBooking />} />
          <Route path="/accommodation" element={<Accommodation />} />
          <Route path="/hotelbooking" element={<HotelBooking />} />
          <Route path="/register" element={<Register />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
