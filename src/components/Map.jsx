import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import {
  FeatureGroup,
  LayersControl,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";

// Import leaflet-draw directement
import "leaflet-draw";

// Liste des fonds de carte disponibles
const basemaps = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: "OpenStreetMap",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    name: "Satellite",
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors',
    name: "Topographique",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: "Mode sombre",
  },
  mapboxStreets: {
    url: "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
    attribution:
      '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    accessToken: import.meta.env.VITE_MAPBOX_TOKEN || "",
    name: "Mapbox Streets",
  },
};

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

// Composant pour géolocalisations au chargement ou sur demande
const GeoLocationControl = ({ onLocationFound }) => {
  const map = useMap();

  const handleLocationFound = (e) => {
    map.flyTo(e.latlng, 13);
    if (onLocationFound) {
      onLocationFound(e.latlng);
    }
  };

  const handleGeoLocation = () => {
    map.locate({ setView: false });
  };

  useEffect(() => {
    map.on("locationfound", handleLocationFound);

    return () => {
      map.off("locationfound", handleLocationFound);
    };
  }, [map]);

  // Ajouter un bouton de géolocalisation à la carte
  useEffect(() => {
    const geoLocateControl = L.control({ position: "topleft" });

    geoLocateControl.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      const button = L.DomUtil.create("a", "", div);

      button.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><point cx="12" cy="12" r="1"></point></svg>';
      button.title = "Votre position";
      button.style.display = "flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.fontSize = "18px";
      button.style.width = "30px";
      button.style.height = "30px";

      L.DomEvent.on(button, "click", (e) => {
        L.DomEvent.stopPropagation(e);
        handleGeoLocation();
      });

      return div;
    };

    geoLocateControl.addTo(map);

    return () => {
      geoLocateControl.remove();
    };
  }, [map]);

  return null;
};

const MapComponent = ({
  onPolygonDrawn,
  defaultCenter = [48.856614, 2.3522219],
}) => {
  const [selectedBasemap, setSelectedBasemap] = useState("osm");
  const [mapCenter, setMapCenter] = useState(defaultCenter);

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

  const handleLocationFound = (latlng) => {
    setMapCenter([latlng.lat, latlng.lng]);
  };

  return (
    <div className="w-full h-[70vh] relative">
      <MapContainer
        center={mapCenter}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        {/* Contrôle des couches */}
        <LayersControl position="topright">
          {Object.entries(basemaps).map(([key, layer]) => (
            <LayersControl.BaseLayer
              key={key}
              name={layer.name}
              checked={key === selectedBasemap}
            >
              <TileLayer
                url={layer.url}
                attribution={layer.attribution}
                {...(layer.accessToken && { accessToken: layer.accessToken })}
                {...(layer.subdomains && { subdomains: layer.subdomains })}
                {...(layer.ext && { ext: layer.ext })}
                {...(layer.minZoom && { minZoom: layer.minZoom })}
                {...(layer.maxZoom && { maxZoom: layer.maxZoom })}
              />
            </LayersControl.BaseLayer>
          ))}
        </LayersControl>

        {/* Contrôle de géolocalisation */}
        <GeoLocationControl onLocationFound={handleLocationFound} />

        {/* Outil de dessin de polygones */}
        <DrawControl onPolygonDrawn={onPolygonDrawn} />
      </MapContainer>


    </div>
  );
};

export default MapComponent;
