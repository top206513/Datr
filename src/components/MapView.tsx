import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { CATEGORY_META, CITY_CENTER } from '@/data/locations'
import type { DateLocation } from '@/types'

interface MapViewProps {
  locations: DateLocation[]
  activeId: string | null
  chosenId: string | null
  onSelect: (id: string) => void
}

function buildIcon(location: DateLocation, active: boolean): L.DivIcon {
  return L.divIcon({
    className: 'rl-pin-wrapper',
    html: `<div class="rl-pin${active ? ' rl-pin--active' : ''}">${
      CATEGORY_META[location.category].icon
    }</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  })
}

/**
 * Обёртка над Leaflet: карта живёт вне React-дерева, поэтому создаётся один раз,
 * а дальше синхронизируется точечными эффектами.
 */
export function MapView({ locations, activeId, chosenId, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef(new Map<string, L.Marker>())
  const [tilesFailed, setTilesFailed] = useState(false)
  const selectRef = useRef(onSelect)
  selectRef.current = onSelect

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: CITY_CENTER,
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    })

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    })

    // Без сети подложка не загрузится — точки всё равно останутся на своих местах.
    tiles.on('tileerror', () => setTilesFailed(true))
    tiles.on('tileload', () => setTilesFailed(false))
    tiles.addTo(map)

    // Колесо мыши масштабирует только после клика по карте —
    // иначе страница «залипает» при скролле мимо неё.
    map.on('click', () => map.scrollWheelZoom.enable())
    map.on('mouseout', () => map.scrollWheelZoom.disable())

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Синхронизация набора маркеров с отфильтрованным списком
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const markers = markersRef.current
    const visible = new Set(locations.map((l) => l.id))

    for (const [id, marker] of markers) {
      if (!visible.has(id)) {
        marker.remove()
        markers.delete(id)
      }
    }

    for (const location of locations) {
      if (markers.has(location.id)) continue

      const marker = L.marker([location.coords.lat, location.coords.lng], {
        icon: buildIcon(location, false),
        title: location.name,
        riseOnHover: true,
      })
        .addTo(map)
        .bindPopup(
          `<strong style="font-size:14px">${location.name}</strong><br/><span style="opacity:.7">${location.area}</span>`,
        )
        .on('click', () => selectRef.current(location.id))

      markers.set(location.id, marker)
    }

    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((l) => [l.coords.lat, l.coords.lng]))
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 13, animate: true })
    }
  }, [locations])

  // Подсветка активной точки
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    for (const location of locations) {
      const marker = markersRef.current.get(location.id)
      if (!marker) continue
      const active = location.id === activeId || location.id === chosenId
      marker.setIcon(buildIcon(location, active))
      marker.setZIndexOffset(active ? 1000 : 0)
    }

    if (!activeId) return
    const active = locations.find((l) => l.id === activeId)
    if (!active) return

    map.flyTo([active.coords.lat, active.coords.lng], Math.max(map.getZoom(), 14), {
      duration: 0.9,
    })
    markersRef.current.get(activeId)?.openPopup()
  }, [activeId, chosenId, locations])

  return (
    <div className="rl-map glass relative h-[380px] overflow-hidden rounded-xl2 sm:h-[460px] lg:h-full lg:min-h-[560px]">
      <div ref={containerRef} className="h-full w-full" />

      {tilesFailed && (
        <p className="pointer-events-none absolute inset-x-4 top-4 z-500 mx-auto max-w-xs rounded-xl border border-white/12 bg-night-900/90 px-4 py-2.5 text-center text-xs text-mist-300 backdrop-blur">
          Подложка карты не загрузилась — нет соединения. Точки и карточки работают как обычно.
        </p>
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl2 shadow-[inset_0_0_90px_rgba(11,6,14,0.85)]"
      />
    </div>
  )
}
