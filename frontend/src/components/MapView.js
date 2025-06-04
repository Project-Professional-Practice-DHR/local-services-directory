import { useEffect, useRef } from 'react';

const MapView = ({ services }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 12,
    });

    services.forEach(service => {
      if (service.location) {
        const marker = new window.google.maps.Marker({
          position: service.location,
          map,
          title: service.name,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<h3>${service.name}</h3><p>${service.category}</p><p>Rating: ${service.rating}</p>`
        });

        marker.addListener('click', () => infoWindow.open(map, marker));
      }
    });
  }, [services]);

  return <div ref={mapRef} className="map-view" />;
};

export default MapView;
