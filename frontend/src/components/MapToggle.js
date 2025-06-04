import React, { useState } from 'react';
import MapView from './MapView';  // Assuming you already have a MapView component
import ServiceCard from './ServiceCard';  // Assuming you already have a ServiceCard component

const MapToggle = ({ services }) => {
  const [showMap, setShowMap] = useState(false);

  const handleToggleView = () => {
    setShowMap(!showMap);
  };

  return (
    <div className="map-toggle-container">
      <button className="map-toggle-btn" onClick={handleToggleView}>
        {showMap ? 'Switch to List View' : 'Switch to Map View'}
      </button>

      {showMap ? (
        <MapView services={services} />
      ) : (
        <div className="service-list">
          {services.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MapToggle;
