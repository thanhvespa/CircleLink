import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import LiveBoard from './views/LiveBoard';
import HostAdmin from './views/HostAdmin';
import GuestCheckin from './views/GuestCheckin';
import EventDirectory from './views/EventDirectory';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:slug" element={<LiveBoard />} />
        <Route path="/event/:slug/admin" element={<HostAdmin />} />
        <Route path="/checkin/:slug" element={<GuestCheckin />} />
        <Route path="/directory/:slug" element={<EventDirectory />} />
      </Routes>
    </Router>
  );
}

export default App;
