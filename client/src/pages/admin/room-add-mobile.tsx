import { useState, useRef, ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Room, Hotel, insertRoomSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
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
import { Check, Image, UploadCloud, ArrowLeft, Loader2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const roomTypes = [
  { id: 1, label: "Standart" },
  { id: 2, label: "Deluxe" },
  { id: 3, label: "Suite" },
  { id: 4, label: "Aile Odası" },
  { id: 5, label: "Ekonomik" },
];

const availableFeatures = [
  { id: 1, label: "Klima" },
  { id: 2, label: "Wi-Fi" },
  { id: 3, label: "Minibar" },
  { id: 4, label: "TV" },
  { id: 5, label: "Jakuzi" },
  { id: 6, label: "Balkon" },
  { id: 7, label: "Deniz Manzarası" },
  { id: 8, label: "Kahvaltı Dahil" },
  { id: 9, label: "Özel Banyo" },
  { id: 10, label: "Çalışma Masası" },
];

const roomFormSchema = insertRoomSchema.extend({
  hotelId: z.number({
    required_error: "Lütfen bir otel seçin",
  }),
  capacity: z.number({
    required_error: "Lütfen kapasite seçin",
  }),
  features: z.array(z.string()).default([]),
});
type RoomFormValues = z.infer<typeof roomFormSchema>;

export default function RoomAddMobile() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [images, setImages] = useState<{ url: string, filename: string, isMain: boolean }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: hotels = [] } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
    staleTime: 10 * 60 * 1000,
  });

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      hotelId: undefined,
      name: "",
      description: "",
      capacity: 2,
      imageUrl: "",
      features: [],
      type: "Standart",
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: RoomFormValues) => {
      if (!data.imageUrl && images.length > 0) {
        throw new Error('Lütfen bir ana resim belirleyin.');
      }
      const imagesData = images.map(img => ({
        url: img.url,
        filename: img.filename,
        isMain: img.isMain
      }));
      let updatedData = {
        ...data,
        price: 0, // Fiyat zorunluysa backend için default gönderiyoruz
        images: JSON.stringify(imagesData)
      };
      const res = await apiRequest("POST", "/api/rooms", updatedData);
      return await res.json();
    },
    onSuccess: (data: Room) => {
      toast({
        title: "Başarılı",
        description: "Oda başarıyla eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      navigate("/admin/rooms");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Oda eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: RoomFormValues) => {
    if (!data.hotelId) {
      toast({
        title: "Validasyon Hatası",
        description: "Lütfen bir otel seçin",
        variant: "destructive",
      });
      return;
    }
    if (!data.name) {
      toast({
        title: "Validasyon Hatası",
        description: "Lütfen oda adını girin",
        variant: "destructive",
      });
      return;
    }
    if (images.length === 0) {
      toast({
        title: "Resim Gerekli",
        description: "Lütfen en az bir oda resmi ekleyin",
        variant: "destructive",
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
          <div className="flex items-center px-4 h-14">
            <Button variant="ghost" size="icon" className="text-white" asChild>
              <Link href="/admin/rooms">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="flex-1 text-center font-semibold text-lg">Yeni Oda Ekle</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                      <SelectTrigger className="h-12 bg-white shadow-sm border-[#2094f3]/20">
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
                    <Input
                      placeholder="Standart Oda"
                      className="h-12 bg-white shadow-sm border-[#2094f3]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kapasite</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white shadow-sm border-[#2094f3]/20">
                        <SelectValue placeholder="Kapasite" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 Kişilik</SelectItem>
                      <SelectItem value="2">2 Kişilik</SelectItem>
                      <SelectItem value="3">3 Kişilik</SelectItem>
                      <SelectItem value="4">4 Kişilik</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white shadow-sm border-[#2094f3]/20">
                        <SelectValue placeholder="Oda tipi seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type.id} value={type.label}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <FormLabel className="font-medium">Oda Resimleri</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="border-[#2094f3] text-[#2094f3]"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UploadCloud className="h-4 w-4 mr-2" />
                    )}
                    Resim Yükle
                  </Button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border border-[#2094f3]/20 aspect-video">
                        <img
                          src={image.url}
                          alt={`Oda resmi ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.isMain && (
                          <div className="absolute top-1 left-1 bg-[#2094f3] text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Ana Resim
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 flex space-x-1">
                          {!image.isMain && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full bg-white/90 border-none hover:bg-white"
                              onClick={() => setMainImage(index)}
                            >
                              <Image className="h-4 w-4 text-[#2094f3]" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full bg-white/90 border-none hover:bg-white"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-[#2094f3]/40 p-8 text-center">
                    <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2094f3]/10">
                        <Image className="h-5 w-5 text-[#2094f3]" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Resim yükleyin</h3>
                      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        Lütfen odanın görsellerini ekleyin. İlk yüklediğiniz resim ana resim olarak kullanılacaktır.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Oda hakkında detaylı bilgi..."
                      rows={3}
                      className="bg-white shadow-sm border-[#2094f3]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="features"
              render={() => (
                <FormItem>
                  <FormLabel>Özellikler</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableFeatures.map((feature) => (
                      <FormField
                        key={feature.id}
                        control={form.control}
                        name="features"
                        render={({ field }) => (
                          <FormItem
                            key={feature.id}
                            className="flex flex-row items-center space-x-2 space-y-0 bg-white shadow-sm p-3 rounded-md border border-[#2094f3]/20"
                          >
                            <FormControl>
                              <Checkbox
                                className="h-5 w-5 text-[#2094f3] border-[#2094f3]"
                                checked={field.value?.includes(feature.label)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, feature.label])
                                    : field.onChange(
                                      field.value?.filter((value) => value !== feature.label)
                                    );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer font-normal">
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
              {createRoomMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Odayı Kaydet
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

