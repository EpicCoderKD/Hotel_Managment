import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from "./components/HomePage";  
import HotelBooking from './components/HotelBooking';
import Accommodation from './components/Accommodation';
import './App.css';
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<Accommodation />} />
          <Route path="/accommodation" element={<Accommodation />} />
          <Route path="/hotelbooking" element={<HotelBooking />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
