import React, { useEffect, useRef, useState } from 'react';

interface LocationData {
  location: string;
  latitude: number;
  longitude: number;
  job_count: number;
  top_skills?: string[];
}

interface MapViewProps {
  data?: LocationData[];
}

// NOVA/DC bounding box
const NOVA_BOUNDS = {
  north: 39.0,
  south: 38.7,
  east: -76.8,
  west: -77.5,
  center: { lat: 38.9, lng: -77.1 }
};

export const MapView: React.FC<MapViewProps> = ({ data = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const container = mapRef.current;
    const width = container.clientWidth;
    const height = 400;

    // Create SVG map
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.backgroundColor = '#f0f4f8';
    svg.style.borderRadius = '8px';

    // Calculate scale factors
    const latRange = NOVA_BOUNDS.north - NOVA_BOUNDS.south;
    const lngRange = NOVA_BOUNDS.east - NOVA_BOUNDS.west;
    const scaleX = width / lngRange;
    const scaleY = height / latRange;

    const projectPoint = (lat: number, lng: number) => {
      const x = (lng - NOVA_BOUNDS.west) * scaleX;
      const y = height - (lat - NOVA_BOUNDS.south) * scaleY;
      return { x, y };
    };

    // Draw map background with gradient
    const boundsRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    boundsRect.setAttribute('x', '0');
    boundsRect.setAttribute('y', '0');
    boundsRect.setAttribute('width', width.toString());
    boundsRect.setAttribute('height', height.toString());
    boundsRect.setAttribute('fill', '#f0f4f8');
    svg.appendChild(boundsRect);

    // Add subtle grid pattern for map-like appearance
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('opacity', '0.2');
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      const y = (height / 10) * i;
      
      // Vertical lines
      const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vLine.setAttribute('x1', x.toString());
      vLine.setAttribute('y1', '0');
      vLine.setAttribute('x2', x.toString());
      vLine.setAttribute('y2', height.toString());
      vLine.setAttribute('stroke', '#64748b');
      vLine.setAttribute('stroke-width', '1');
      gridGroup.appendChild(vLine);
      
      // Horizontal lines
      const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLine.setAttribute('x1', '0');
      hLine.setAttribute('y1', y.toString());
      hLine.setAttribute('x2', width.toString());
      hLine.setAttribute('y2', y.toString());
      hLine.setAttribute('stroke', '#64748b');
      hLine.setAttribute('stroke-width', '1');
      gridGroup.appendChild(hLine);
    }
    svg.appendChild(gridGroup);

    // Add major geographic reference points (major cities in NOVA/DC area)
    const majorCities = [
      { name: 'Washington DC', lat: 38.9072, lng: -77.0369 },
      { name: 'Arlington', lat: 38.8816, lng: -77.0910 },
      { name: 'Alexandria', lat: 38.8048, lng: -77.0469 },
      { name: 'Fairfax', lat: 38.8462, lng: -77.3064 },
      { name: 'Reston', lat: 38.9586, lng: -77.3570 },
    ];

    majorCities.forEach(city => {
      const { x, y } = projectPoint(city.lat, city.lng);
      
      // City marker (small dot)
      const cityDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      cityDot.setAttribute('cx', x.toString());
      cityDot.setAttribute('cy', y.toString());
      cityDot.setAttribute('r', '3');
      cityDot.setAttribute('fill', '#64748b');
      cityDot.setAttribute('opacity', '0.5');
      svg.appendChild(cityDot);
      
      // City label
      const cityLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      cityLabel.setAttribute('x', (x + 6).toString());
      cityLabel.setAttribute('y', (y - 6).toString());
      cityLabel.setAttribute('font-size', '9');
      cityLabel.setAttribute('fill', '#64748b');
      cityLabel.setAttribute('opacity', '0.6');
      cityLabel.setAttribute('font-weight', '400');
      cityLabel.textContent = city.name;
      svg.appendChild(cityLabel);
    });

    // Add border
    const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    border.setAttribute('x', '0');
    border.setAttribute('y', '0');
    border.setAttribute('width', width.toString());
    border.setAttribute('height', height.toString());
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', '#cbd5e0');
    border.setAttribute('stroke-width', '2');
    svg.appendChild(border);

    // Draw location markers (job postings)
    if (data.length > 0) {
      const maxJobs = Math.max(...data.map(d => d.job_count), 1);
      const minRadius = 6;
      const maxRadius = 24;

      data.forEach((location) => {
        const { x, y } = projectPoint(location.latitude, location.longitude);
        const radius = minRadius + ((location.job_count / maxJobs) * (maxRadius - minRadius));

        // Outer glow effect
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glow.setAttribute('cx', x.toString());
        glow.setAttribute('cy', y.toString());
        glow.setAttribute('r', (radius + 2).toString());
        glow.setAttribute('fill', '#3b82f6');
        glow.setAttribute('opacity', '0.2');
        svg.appendChild(glow);

        // Main circle marker
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x.toString());
        circle.setAttribute('cy', y.toString());
        circle.setAttribute('r', radius.toString());
        circle.setAttribute('fill', '#3b82f6');
        circle.setAttribute('fill-opacity', '0.7');
        circle.setAttribute('stroke', '#1e40af');
        circle.setAttribute('stroke-width', '2');
        circle.style.cursor = 'pointer';
        circle.setAttribute('class', 'job-marker');
        
        const originalRadius = radius;
        const originalOpacity = '0.7';
        
        circle.addEventListener('mouseenter', (e) => {
          setSelectedLocation(location);
          setTooltipPosition({ x: e.clientX, y: e.clientY });
          circle.setAttribute('fill-opacity', '0.9');
          circle.setAttribute('r', (originalRadius * 1.15).toString());
          glow.setAttribute('r', (originalRadius * 1.15 + 2).toString());
          glow.setAttribute('opacity', '0.3');
        });

        circle.addEventListener('mouseleave', () => {
          setSelectedLocation(null);
          setTooltipPosition(null);
          circle.setAttribute('fill-opacity', originalOpacity);
          circle.setAttribute('r', originalRadius.toString());
          glow.setAttribute('r', (originalRadius + 2).toString());
          glow.setAttribute('opacity', '0.2');
        });

        svg.appendChild(circle);

        // Job count label (only show if radius is large enough)
        if (radius > 10) {
          const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          countText.setAttribute('x', x.toString());
          countText.setAttribute('y', (y + 4).toString());
          countText.setAttribute('text-anchor', 'middle');
          countText.setAttribute('font-size', '10');
          countText.setAttribute('fill', '#ffffff');
          countText.setAttribute('font-weight', '600');
          countText.textContent = location.job_count.toString();
          svg.appendChild(countText);
        }
      });
    }

    // Clear and append
    container.innerHTML = '';
    container.appendChild(svg);

    return () => {
      container.innerHTML = '';
    };
  }, [data]);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        style={{ height: '400px' }}
      />
      
      {/* Tooltip */}
      {selectedLocation && tooltipPosition && (
        <div
          className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 min-w-[200px] pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 10}px`,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {selectedLocation.location}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong>{selectedLocation.job_count.toLocaleString()}</strong> jobs
          </div>
          {selectedLocation.top_skills && selectedLocation.top_skills.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              <div className="font-medium mb-1">Top Skills:</div>
              <div className="flex flex-wrap gap-1">
                {selectedLocation.top_skills.slice(0, 3).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map Info */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        NOVA/DC Region • {data.length} locations • {data.reduce((sum, d) => sum + d.job_count, 0).toLocaleString()} total jobs
      </div>
    </div>
  );
};

export default MapView;
