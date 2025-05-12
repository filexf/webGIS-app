import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { FeatureGroup, MapContainer, TileLayer, useMap } from "react-leaflet";

// Import leaflet-draw directement
import "leaflet-draw";

// Composant interne pour accéder à l'instance de la carte
const DrawControl = ({ onPolygonDrawn }) => {
  const map = useMap();
  const featureGroupRef = useRef(null);

  useEffect(() => {
    if (!featureGroupRef.current) return;

    // Création des contrôles de dessin
    const drawControl = new L.Control.Draw({
      draw: {
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
      },
      edit: {
        featureGroup: featureGroupRef.current,
      },
    });

    // Ajout des contrôles à la carte
    map.addControl(drawControl);

    // Gestion de l'événement de dessin terminé
    map.on(L.Draw.Event.CREATED, (e) => {
      const { layerType, layer } = e;

      if (layerType === "polygon") {
        // Ajout de la couche au FeatureGroup
        featureGroupRef.current.addLayer(layer);

        // Extraire les coordonnées du polygone
        const polygonCoords = layer
          .getLatLngs()[0]
          .map((coord) => [coord.lat, coord.lng]);

        // Passer les coordonnées au composant parent
        onPolygonDrawn(polygonCoords);
      }
    });

    // Nettoyage lors du démontage du composant
    return () => {
      map.removeControl(drawControl);
    };
  }, [map, onPolygonDrawn]);

  return <FeatureGroup ref={featureGroupRef} />;
};

const MapComponent = ({ onPolygonDrawn }) => {
  useEffect(() => {
    // Correction du problème d'icône Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <div className="w-full h-[70vh]">
      <MapContainer
        center={[48.856614, 2.3522219]} // Paris par défaut
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DrawControl onPolygonDrawn={onPolygonDrawn} />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
