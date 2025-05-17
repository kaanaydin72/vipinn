import { Hotel } from "@shared/schema";
import { ChevronLeft, ChevronRight, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import HotelFeatures from "./hotel-features";

interface HotelDetailProps {
  hotel: Hotel;
}

export default function HotelDetail({ hotel }: HotelDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { name, location, description, mainImage, images, rating, stars, features, address } = hotel;
  
  const allImages = [mainImage, ...(images || [])].filter(Boolean);
  
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Hotel Image Gallery */}
        <div className="relative">
          <div className="relative aspect-w-4 aspect-h-3 rounded-lg overflow-hidden">
            <img 
              src={allImages[currentImageIndex]} 
              alt={name} 
              className="object-cover w-full h-full"
            />
            
            {/* Navigation Arrows */}
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <Button 
                variant="secondary" 
                size="icon" 
                onClick={handlePrevImage}
                className="rounded-full opacity-80 hover:opacity-100"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button 
                variant="secondary" 
                size="icon" 
                onClick={handleNextImage}
                className="rounded-full opacity-80 hover:opacity-100"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Star Badge */}
            <div className="absolute top-4 right-4 px-2 py-1 bg-primary text-white text-sm font-semibold rounded">
              {stars} Yıldız
            </div>
          </div>
          
          {/* Thumbnail Selector */}
          <div className="mt-4 grid grid-cols-5 gap-2">
            {allImages.slice(0, 5).map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`relative rounded-md overflow-hidden ${
                  currentImageIndex === index 
                    ? "ring-2 ring-primary" 
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <div className="aspect-w-1 aspect-h-1">
                  <img 
                    src={image} 
                    alt={`Thumbnail ${index + 1}`} 
                    className="object-cover"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Hotel Details */}
        <div>
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold font-heading text-foreground">{name}</h1>
            <div className="flex items-center">
              <Star className="h-5 w-5 fill-secondary text-secondary" />
              <span className="ml-1 text-foreground font-medium">{rating?.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="mt-2 flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{address || location}</span>
          </div>
          
          <div className="mt-6 prose max-w-none">
            <p className="text-muted-foreground">{description}</p>
          </div>
          
          {/* Hotel Features */}
          <HotelFeatures features={features} />
          
          {/* Call to Action */}
          <div className="mt-8">
            <div className="flex items-center space-x-4">
              <Button className="px-8" size="lg">
                Oda Seç ve Rezervasyon Yap
              </Button>
              <p className="text-sm text-muted-foreground">
                Hemen rezervasyon yaparak en uygun fiyat garantisinden yararlanın!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
