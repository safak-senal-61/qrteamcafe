'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressAutocompleteProps {
  onAddressSelect: (data: {
    address: string;
    city: string;
    country: string;
    zipCode: string;
  }) => void;
  defaultValue?: string;
  className?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
    suburb?: string;
    neighbourhood?: string;
    road?: string;
    house_number?: string;
  };
}

export default function AddressAutocomplete({ onAddressSelect, defaultValue = '', className }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync internal value if defaultValue changes externally
  useEffect(() => {
    if (defaultValue) {
      setQuery(defaultValue);
    }
  }, [defaultValue]);

  const handleSearch = async (value: string) => {
    setQuery(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value.length < 3) {
      setResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&addressdetails=1&countrycodes=tr&limit=5`,
          {
            headers: {
              'Accept-Language': 'tr-TR',
              'User-Agent': 'QRTeamCafe/1.0'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error('Nominatim search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce
  };

  const handleSelect = (result: NominatimResult) => {
    const address = result.display_name;
    const { city, town, village, state, country, postcode } = result.address;
    
    // Şehir bilgisini bul (farklı alanlarda olabilir)
    const cityName = city || town || village || state || '';
    const countryName = country || 'Turkey';
    const zip = postcode || '';

    setQuery(address);
    setResults([]);
    setShowSuggestions(false);

    onAddressSelect({
      address: address,
      city: cityName,
      country: countryName,
      zipCode: zip
    });
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative group w-full">
        <MapPin className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowSuggestions(true);
          }}
          placeholder="Mahalle, Cadde, Sokak, No..."
          className={cn("pl-9 sm:pl-10 h-10 sm:h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 transition-all rounded-lg sm:rounded-xl text-sm w-full", className)}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-slate-400" />
        )}
      </div>
      
      {showSuggestions && results.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {results.map((result) => (
            <li
              key={result.place_id}
              onClick={() => handleSelect(result)}
              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm flex items-center gap-2 text-slate-700 border-b last:border-0 border-slate-50"
            >
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span className="truncate">{result.display_name}</span>
            </li>
          ))}
          <li className="px-4 py-2 text-[10px] text-slate-400 text-center bg-slate-50">
            © OpenStreetMap contributors
          </li>
        </ul>
      )}
    </div>
  );
}