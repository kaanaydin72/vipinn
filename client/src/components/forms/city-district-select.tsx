import { useState, useEffect } from "react";
import { turkishCities, City, District } from "@/data/turkish-cities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormItem } from "@/components/ui/form";

interface CityDistrictSelectProps {
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
  selectedCity?: string;
  selectedDistrict?: string;
  cityLabel?: string;
  districtLabel?: string;
}

export function CityDistrictSelect({
  onCityChange,
  onDistrictChange,
  selectedCity = "",
  selectedDistrict = "",
  cityLabel = "Şehir",
  districtLabel = "İlçe"
}: CityDistrictSelectProps) {
  const [city, setCity] = useState(selectedCity);
  const [district, setDistrict] = useState(selectedDistrict);
  const [districts, setDistricts] = useState<District[]>([]);

  // When city changes, update districts and reset selected district
  useEffect(() => {
    const selectedCityObj = turkishCities.find(c => c.id === city);
    if (selectedCityObj) {
      setDistricts(selectedCityObj.districts);
      if (!selectedCityObj.districts.some(d => d.id === district)) {
        setDistrict("");
        onDistrictChange("");
      }
    } else {
      setDistricts([]);
      setDistrict("");
      onDistrictChange("");
    }
  }, [city, district, onDistrictChange]);

  // Initialize the component with selectedCity data if provided
  useEffect(() => {
    if (selectedCity) {
      const initialCityObj = turkishCities.find(c => c.id === selectedCity);
      if (initialCityObj) {
        setDistricts(initialCityObj.districts);
      }
    }
  }, [selectedCity]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="city">{cityLabel}*</Label>
        <Select
          value={city}
          onValueChange={(value) => {
            setCity(value);
            onCityChange(value);
          }}
        >
          <SelectTrigger id="city">
            <SelectValue placeholder="Şehir seçin" />
          </SelectTrigger>
          <SelectContent>
            {turkishCities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="district">{districtLabel}*</Label>
        <Select
          value={district}
          onValueChange={(value) => {
            setDistrict(value);
            onDistrictChange(value);
          }}
          disabled={districts.length === 0}
        >
          <SelectTrigger id="district">
            <SelectValue placeholder={districts.length === 0 ? "Önce şehir seçin" : "İlçe seçin"} />
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}