import { 
  WavesLadder, 
  Waves, 
  Utensils, 
  Wine, 
  Dumbbell, 
  Leaf, 
  Wifi, 
  Car 
} from "lucide-react";

interface HotelFeaturesProps {
  features?: string[];
}

export default function HotelFeatures({ features = [] }: HotelFeaturesProps) {
  // Feature icons mapping
  const getFeatureIcon = (feature: string) => {
    switch(feature) {
      case "Havuz":
        return <WavesLadder className="h-5 w-5" />;
      case "Plaj":
        return <Waves className="h-5 w-5" />;
      case "Restoran":
        return <Utensils className="h-5 w-5" />;
      case "Bar":
        return <Wine className="h-5 w-5" />;
      case "Fitness":
        return <Dumbbell className="h-5 w-5" />;
      case "Bahçe":
        return <Leaf className="h-5 w-5" />;
      case "Ücretsiz Wi-Fi":
        return <Wifi className="h-5 w-5" />;
      case "Otopark":
        return <Car className="h-5 w-5" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-primary/10" />;
    }
  };

  // Feature background colors
  const getFeatureColor = (feature: string) => {
    switch(feature) {
      case "Havuz":
        return "bg-blue-100 text-blue-800";
      case "Plaj":
        return "bg-yellow-100 text-yellow-800";
      case "Restoran":
        return "bg-green-100 text-green-800";
      case "Bar":
        return "bg-red-100 text-red-800";
      case "Fitness":
        return "bg-orange-100 text-orange-800";
      case "Bahçe":
        return "bg-emerald-100 text-emerald-800";
      case "Ücretsiz Wi-Fi":
        return "bg-indigo-100 text-indigo-800";
      case "Otopark":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!features.length) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Özellikler</h3>
      <div className="flex flex-wrap gap-2">
        {features.map((feature, index) => (
          <div 
            key={index}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getFeatureColor(feature)}`}
          >
            <span className="mr-1.5">{getFeatureIcon(feature)}</span>
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
}
