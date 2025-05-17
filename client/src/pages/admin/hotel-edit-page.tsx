import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Hotel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, ArrowLeft, Hotel as HotelIcon, Star } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeviceType } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

export default function HotelEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  // Otel düzenleme formu için state
  const [editForm, setEditForm] = useState<Partial<Hotel>>({
    name: "",
    location: "",
    address: "",
    description: "",
    imageUrl: "",
    stars: 0,
    phone: "",
    amenities: []
  });

  // Otel detayını getir
  const { 
    data: hotel,
    isLoading: isHotelLoading,
    isError: isHotelError 
  } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${id}`]
  });

  // Oteli güncelleme mutasyonu
  const updateHotelMutation = useMutation({
    mutationFn: async (updatedHotel: Partial<Hotel>) => {
      const response = await apiRequest("PUT", `/api/hotels/${id}`, updatedHotel);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hotels/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
      toast({
        title: "Otel güncellendi",
        description: "Otel bilgileri başarıyla güncellendi.",
      });
      navigate("/admin/hotels");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Otel güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Otel verisi geldiğinde form bilgilerini doldur
  useEffect(() => {
    if (hotel) {
      setEditForm({
        name: hotel.name,
        location: hotel.location,
        address: hotel.address,
        description: hotel.description,
        imageUrl: hotel.imageUrl,
        stars: hotel.stars,
        phone: hotel.phone || "",
        amenities: hotel.amenities || []
      });
    }
  }, [hotel]);

  const handleEditFormChange = (field: string, value: any) => {
    setEditForm({
      ...editForm,
      [field]: value
    });
  };

  const handleSaveHotel = () => {
    updateHotelMutation.mutate(editForm);
  };

  // Hata durumlarını kontrol et
  if (isHotelError) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Otel bulunamadı</h1>
          <p className="text-gray-600 mb-6">Aradığınız otel bulunamadı veya bir hata oluştu.</p>
          <Button asChild>
            <Link href="/admin/hotels">Otellere Dön</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isHotelLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#2094f3] mb-4" />
          <p className="text-neutral-500">Otel bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Mobil tasarım
  if (isMobile) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* iOS/Android tarzı başlık */}
        <div className="sticky top-0 z-10">
          <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
            <div className="flex items-center px-4 h-14">
              <Button variant="ghost" size="icon" className="text-white" asChild>
                <Link href="/admin/hotels">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="flex-1 text-center font-semibold text-lg">Otel Düzenle</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white"
                onClick={handleSaveHotel}
                disabled={updateHotelMutation.isPending}
              >
                <Save className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 pb-20">
          {/* Otel Bilgisi Alanı */}
          <div className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Otel Adı</Label>
                <Input 
                  id="name" 
                  value={editForm.name || ""} 
                  onChange={(e) => handleEditFormChange("name", e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="location">Konum</Label>
                <Input 
                  id="location" 
                  value={editForm.location || ""} 
                  onChange={(e) => handleEditFormChange("location", e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea 
                  id="address" 
                  value={editForm.address || ""} 
                  onChange={(e) => handleEditFormChange("address", e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefon Numarası</Label>
                <Input 
                  id="phone" 
                  value={editForm.phone || ""} 
                  onChange={(e) => handleEditFormChange("phone", e.target.value)}
                  className="mt-1"
                  placeholder="0212 123 45 67"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea 
                  id="description" 
                  value={editForm.description || ""} 
                  onChange={(e) => handleEditFormChange("description", e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="imageUrl">Görsel URL</Label>
                <Input 
                  id="imageUrl" 
                  value={editForm.imageUrl || ""} 
                  onChange={(e) => handleEditFormChange("imageUrl", e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="stars">Yıldız Sayısı</Label>
                <Select 
                  value={editForm.stars?.toString() || "0"} 
                  onValueChange={(value) => handleEditFormChange("stars", parseInt(value))}
                >
                  <SelectTrigger id="stars" className="mt-1">
                    <SelectValue placeholder="Yıldız sayısı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Yıldız</SelectItem>
                    <SelectItem value="2">2 Yıldız</SelectItem>
                    <SelectItem value="3">3 Yıldız</SelectItem>
                    <SelectItem value="4">4 Yıldız</SelectItem>
                    <SelectItem value="5">5 Yıldız</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2 block">Özellikler</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 border p-3 rounded-md bg-white">
                  {["Wi-Fi", "Kahvaltı", "Havuz", "Spa", "Restoran", "Bar", "Fitness", "Otopark"].map((amenity) => (
                    <div key={amenity} className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`amenity-${amenity}`} 
                        checked={(editForm.amenities || []).includes(amenity)} 
                        onChange={(e) => {
                          const updatedAmenities = e.target.checked 
                            ? [...(editForm.amenities || []), amenity]
                            : (editForm.amenities || []).filter(a => a !== amenity);
                          handleEditFormChange("amenities", updatedAmenities);
                        }}
                        className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`amenity-${amenity}`} className="ml-2 text-sm text-neutral-700">{amenity}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="sticky bottom-4 left-0 right-0 pt-2">
                <div className="mx-auto bg-white rounded-xl shadow-lg border p-4">
                  <Button
                    className="w-full bg-[#2094f3] mb-2"
                    onClick={handleSaveHotel}
                    disabled={updateHotelMutation.isPending}
                  >
                    {updateHotelMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Oteli Güncelle
                  </Button>
                  <Button
                    className="w-full" 
                    variant="outline"
                    asChild
                  >
                    <Link href="/admin/hotels">
                      İptal
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Masaüstü tasarım
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="mr-4" asChild>
              <Link href="/admin/hotels">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold">Otel Düzenle</h1>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              asChild
            >
              <Link href="/admin/hotels">
                İptal
              </Link>
            </Button>
            <Button 
              onClick={handleSaveHotel}
              disabled={updateHotelMutation.isPending}
              className="bg-[#2094f3]"
            >
              {updateHotelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Değişiklikleri Kaydet
            </Button>
          </div>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HotelIcon className="h-5 w-5 mr-2 text-[#2094f3]" />
                  Otel Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="desktop-name">Otel Adı</Label>
                    <Input 
                      id="desktop-name" 
                      value={editForm.name || ""} 
                      onChange={(e) => handleEditFormChange("name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="desktop-location">Konum</Label>
                    <Input 
                      id="desktop-location" 
                      value={editForm.location || ""} 
                      onChange={(e) => handleEditFormChange("location", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="desktop-address">Adres</Label>
                  <Textarea 
                    id="desktop-address" 
                    value={editForm.address || ""} 
                    onChange={(e) => handleEditFormChange("address", e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="desktop-description">Açıklama</Label>
                  <Textarea 
                    id="desktop-description" 
                    value={editForm.description || ""} 
                    onChange={(e) => handleEditFormChange("description", e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="desktop-imageUrl">Görsel URL</Label>
                    <Input 
                      id="desktop-imageUrl" 
                      value={editForm.imageUrl || ""} 
                      onChange={(e) => handleEditFormChange("imageUrl", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="desktop-stars">Yıldız Sayısı</Label>
                    <Select 
                      value={editForm.stars?.toString() || "0"} 
                      onValueChange={(value) => handleEditFormChange("stars", parseInt(value))}
                    >
                      <SelectTrigger id="desktop-stars" className="mt-1">
                        <SelectValue placeholder="Yıldız sayısı seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Yıldız</SelectItem>
                        <SelectItem value="2">2 Yıldız</SelectItem>
                        <SelectItem value="3">3 Yıldız</SelectItem>
                        <SelectItem value="4">4 Yıldız</SelectItem>
                        <SelectItem value="5">5 Yıldız</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="desktop-phone">Telefon Numarası</Label>
                  <Input 
                    id="desktop-phone" 
                    value={editForm.phone || ""} 
                    onChange={(e) => handleEditFormChange("phone", e.target.value)}
                    className="mt-1"
                    placeholder="0212 123 45 67"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Özellikler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Wi-Fi", "Kahvaltı", "Havuz", "Spa", "Restoran", "Bar", "Fitness", "Otopark"].map((amenity) => (
                    <div key={amenity} className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`desktop-amenity-${amenity}`} 
                        checked={(editForm.amenities || []).includes(amenity)} 
                        onChange={(e) => {
                          const updatedAmenities = e.target.checked 
                            ? [...(editForm.amenities || []), amenity]
                            : (editForm.amenities || []).filter(a => a !== amenity);
                          handleEditFormChange("amenities", updatedAmenities);
                        }}
                        className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`desktop-amenity-${amenity}`} className="ml-2 text-sm text-neutral-700">{amenity}</label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Önizleme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-md overflow-hidden mb-3">
                  <img 
                    src={editForm.imageUrl || "https://via.placeholder.com/400x300?text=Otel+Görseli"} 
                    alt={editForm.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium text-lg mb-1">{editForm.name || "Otel Adı"}</h3>
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {Array.from({ length: editForm.stars || 0 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-neutral-500 ml-2">{editForm.location || "Konum"}</span>
                </div>
                <p className="text-sm text-neutral-600 line-clamp-3">
                  {editForm.description || "Otel açıklaması buraya gelecek..."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}