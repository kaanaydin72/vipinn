import { useState, useRef, ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Room, Hotel, insertRoomSchema } from "@shared/schema";
import { useDeviceType } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check, X, ChevronLeft, Image, UploadCloud } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Özellikler ve oda tipleri
const availableFeatures = [
  { id: "kingYatak", label: "King Yatak" },
  { id: "wifi", label: "Ücretsiz Wi-Fi" },
  { id: "tv", label: "Akıllı TV" },
  { id: "klima", label: "Klima" },
  { id: "banyo", label: "Özel Banyo" },
  { id: "minibar", label: "Mini Bar" },
  { id: "denizManzara", label: "Deniz Manzarası" },
  { id: "jakuzi", label: "Jakuzi" },
  { id: "oturmaAlani", label: "Oturma Alanı" },
  { id: "teras", label: "Özel Teras" },
  { id: "ikiYatakOdasi", label: "2 Yatak Odası" },
  { id: "ikiBanyo", label: "2 Banyo" },
];

const roomTypes = [
  { id: "standart", label: "Standart Oda" },
  { id: "deluxe", label: "Deluxe Oda" },
  { id: "suit", label: "Suit Oda" },
  { id: "aile", label: "Aile Odası" },
];

// Schema
const roomFormSchema = insertRoomSchema.extend({
  features: z.array(z.string()).min(1, {
    message: "En az bir özellik seçmelisiniz",
  }),
  hotelId: z.coerce.number(),
});
type RoomFormValues = z.infer<typeof roomFormSchema>;

export default function RoomsAddPage() {
  const { toast } = useToast();
  const [images, setImages] = useState<{ url: string, filename: string, isMain: boolean }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Otelleri çek
  const { data: hotels = [] } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  // Form setup
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      hotelId: 0,
      name: "",
      description: "",
      capacity: 2,
      roomCount: 1,
      imageUrl: "",
      features: [],
      type: "",
    },
  });

  // Mutation
  const createRoomMutation = useMutation({
    mutationFn: async (data: RoomFormValues) => {
      if (!data.imageUrl) {
        throw new Error('Lütfen en az bir resim yükleyin ve ana resim olarak işaretleyin.');
      }
      const imagesData = images.map(img => ({
        url: img.url,
        filename: img.filename,
        isMain: img.isMain
      }));
      const response = await apiRequest("POST", "/api/rooms", {
        ...data,
        images: JSON.stringify(imagesData)
      });
      return await response.json();
    },
    onSuccess: (data: Room) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({
        title: "Oda eklendi",
        description: "Oda başarıyla eklendi.",
      });
      window.history.back();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: RoomFormValues) => {
    if (images.length === 0) {
      toast({
        title: "Resim Gerekli",
        description: "Lütfen en az bir oda resmi ekleyin.",
        variant: "destructive"
      });
      return;
    }
    if (!data.imageUrl && images.length > 0) {
      const updatedImages = [...images];
      updatedImages[0].isMain = true;
      setImages(updatedImages);
      form.setValue('imageUrl', updatedImages[0].url);
      const updatedData = form.getValues();
      createRoomMutation.mutate(updatedData);
      return;
    }
    createRoomMutation.mutate(data);
  };

  // Çoklu resim yükleme
  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }
      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Resim yükleme başarısız oldu');
      }
      const result = await response.json();
      const newImages = result.files.map((file: any, index: number) => ({
        url: file.url,
        filename: file.filename,
        isMain: index === 0 && images.length === 0
      }));
      setImages(prev => {
        const updatedImages = [...prev, ...newImages];
        if (!updatedImages.some(img => img.isMain)) {
          updatedImages[0].isMain = true;
        }
        return updatedImages;
      });
      const mainImage = [...images, ...newImages].find(img => img.isMain);
      if (mainImage) {
        form.setValue('imageUrl', mainImage.url);
      }
      toast({
        title: "Resimler yüklendi",
        description: `${result.files.length} resim başarıyla yüklendi`,
      });
    } catch (error) {
      toast({
        title: "Resim yükleme hatası",
        description: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Ana resmi belirle
  const setMainImage = (index: number) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      isMain: i === index
    }));
    setImages(updatedImages);
    const mainImage = updatedImages.find(img => img.isMain);
    if (mainImage) {
      form.setValue('imageUrl', mainImage.url);
    }
    toast({
      title: "Ana resim güncellendi",
      description: "Seçilen resim ana resim olarak ayarlandı"
    });
  };

  // Resim sil
  const removeImage = (index: number) => {
    const wasMain = images[index].isMain;
    const updatedImages = images.filter((_, i) => i !== index);
    if (wasMain && updatedImages.length > 0) {
      updatedImages[0].isMain = true;
      form.setValue('imageUrl', updatedImages[0].url);
    } else if (updatedImages.length === 0) {
      form.setValue('imageUrl', '');
    }
    setImages(updatedImages);
  };

  // Responsive width
  const deviceType = useDeviceType();
  const maxWidthClass = deviceType === 'mobile' ? 'max-w-3xl' : 'max-w-5xl';

  return (
    <div className={`container mx-auto py-4 ${maxWidthClass}`}>
      <div className="mb-4 flex items-center">
        <Button 
          onClick={() => window.history.back()}
          variant="ghost" 
          className="mr-4 p-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Yeni Oda Ekle</h1>
      </div>
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="hotelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Otel</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Otel seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hotels.map((hotel) => (
                          <SelectItem key={hotel.id} value={hotel.id.toString()}>
                            {hotel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oda Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Deluxe Deniz Manzaralı Oda" {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Odanın detaylı açıklaması"
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kapasite</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="2"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roomCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oda Kontenjanı</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          className="h-12"
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground mt-1">
                        Bu tipten otelde kaç oda var
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oda Tipi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Oda tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Çoklu Resim Yükleme Alanı */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Oda Resimleri</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UploadCloud className="h-4 w-4 mr-2" />
                      )}
                      Resim Yükle
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*"
                      multiple
                    />
                  </div>
                </div>
                {/* Yüklenen resimlerin gösterimi */}
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className={`relative rounded-lg overflow-hidden border-2 ${image.isMain ? 'border-blue-500' : 'border-gray-200'}`}
                      >
                        <img
                          src={image.url}
                          alt={`Oda resmi ${index + 1}`}
                          className="w-full h-36 object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-6 w-6 rounded-full"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {!image.isMain && (
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-6 w-6 rounded-full bg-white"
                              onClick={() => setMainImage(index)}
                            >
                              <Image className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {image.isMain && (
                          <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs font-medium p-1 text-center">
                            Ana Resim
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                    <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Henüz resim yüklenmedi</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Oda resimleri yüklemek için "Resim Yükle" butonuna tıklayın</p>
                  </div>
                )}
              </div>
              {/* Gizli alan - ana resmi tutmak için */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Özellikler */}
              <FormField
                control={form.control}
                name="features"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel className="text-base">Özellikler</FormLabel>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {availableFeatures.map((feature) => (
                        <FormField
                          key={feature.id}
                          control={form.control}
                          name="features"
                          render={({ field }) => (
                            <FormItem
                              key={feature.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(feature.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, feature.id])
                                      : field.onChange(
                                        field.value?.filter((value) => value !== feature.id)
                                      );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {feature.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 bg-[#2094f3] text-white mt-6"
                disabled={createRoomMutation.isPending}
              >
                {createRoomMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Odayı Kaydet
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
