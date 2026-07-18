'use client'

import { useEffect, useRef } from 'react'

interface IPMapProps {
  lat: number
  lon: number
  city: string
}

export default function IPMap({ lat, lon, city }: IPMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    let cancelled = false

    async function initMap() {
      const L = (await import('leaflet')).default

      // Fix default marker icon paths (common Next.js/Webpack issue)
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (cancelled) return

      // Destroy old map if re-rendering
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lon], 11)

      // Dark-themed tile layer for premium look
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map)

      // Add zoom control to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Attribution bottom-left
      L.control.attribution({ position: 'bottomleft' }).addTo(map)

      // Custom lime-colored marker
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div class="map-marker-pin"></div><div class="map-marker-pulse"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      L.marker([lat, lon], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<strong>${city}</strong><br/>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`)
        .openPopup()

      mapInstance.current = map
    }

    initMap()

    return () => {
      cancelled = true
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [lat, lon, city])

  return (
    <div className="map-container">
      <div className="map-label">
        <span>Location Map</span>
      </div>
      <div
        ref={mapRef}
        className="map-viewport"
      />
      <div className="map-coords">
        {lat.toFixed(4)}° N, {Math.abs(lon).toFixed(4)}° {lon >= 0 ? 'E' : 'W'}
      </div>
    </div>
  )
}
