import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Listnav from './components/Listnav';
import Home from './pages/Home';
import List from './pages/List';

const AppRoutes = () => {

  const [listRefreshTrigger, setListRefreshTrigger] = useState(0);

  const refreshList = () => {
    setListRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Router>
      <Navbar refreshList={refreshList} />
      <div className="main-container">
        <Listnav />
        <div className="main-container__inner">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/list/:id" element={<List refreshList={refreshList} refreshTrigger={listRefreshTrigger} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default AppRoutes;