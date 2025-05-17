import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, FileImage, Check } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface FileUploadProps {
  onFileUploaded: (fileUrl: string) => void;
  existingImageUrl?: string;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUploaded, 
  existingImageUrl,
  className = ''
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('error'),
        description: t('fileSize5MbLimit'),
        variant: 'destructive',
      });
      return;
    }

    // Dosya türü kontrolü
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: t('error'),
        description: t('onlyImageFilesAllowed'),
        variant: 'destructive',
      });
      return;
    }

    // Ön izleme URL'i oluştur
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    // Dosyayı upload et
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // FormData ile gönderdiğimiz için Content-Type belirtmiyoruz
        // Tarayıcı otomatik olarak 'multipart/form-data' sınır değerlerini ekleyecek
        credentials: 'include' // Kimlik doğrulama bilgilerini de gönder
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Dosya yükleme hatası');
      }

      // Başarılı yükleme
      onFileUploaded(data.file.url);
      
      // Başarı mesajı göster
      toast({
        title: t('success'),
        description: t('fileUploadedSuccessfully'),
        variant: 'default',
      });
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('fileUploadError'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileUploaded(''); // Boş URL gönder
  };

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {previewUrl ? (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded-md border border-border"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-md flex items-center text-xs">
            <Check className="h-3 w-3 mr-1" /> {t('imageSelected')}
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-md p-8 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
          <FileImage className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">{t('dragAndDropOrClick')}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
          >
            {isUploading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">
                  <Upload className="h-4 w-4" />
                </span>
                {t('uploading')}
              </span>
            ) : (
              <span className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                {t('selectImage')}
              </span>
            )}
          </Button>
        </div>
      )}
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
        disabled={isUploading}
      />
    </div>
  );
};

export default FileUpload;