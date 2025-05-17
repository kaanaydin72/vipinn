import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageContent } from "@shared/schema";

// Tüm içerikleri getir
export function useAllPageContents() {
  return useQuery<PageContent[], Error>({
    queryKey: ["/api/page-contents"],
  });
}

// Belirli bir içeriği getir
export function usePageContent(pageKey: string) {
  return useQuery<PageContent, Error>({
    queryKey: ["/api/page-contents", pageKey],
    enabled: !!pageKey,
  });
}

// Yeni içerik oluştur
export function useCreatePageContent() {
  return useMutation({
    mutationFn: async (data: { pageKey: string; title: string; content: string }) => {
      const response = await apiRequest(
        "POST",
        "/api/page-contents",
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/page-contents"] });
    },
  });
}

// İçerik güncelle
export function useUpdatePageContent() {
  return useMutation({
    mutationFn: async ({
      pageKey,
      ...data
    }: {
      pageKey: string;
      title?: string;
      content?: string;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/page-contents/${pageKey}`,
        data
      );
      return await response.json();
    },
    onSuccess: (data: PageContent) => {
      queryClient.invalidateQueries({ queryKey: ["/api/page-contents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/page-contents", data.pageKey] });
    },
  });
}

// İçerik sil
export function useDeletePageContent() {
  return useMutation({
    mutationFn: async (pageKey: string) => {
      await apiRequest("DELETE", `/api/page-contents/${pageKey}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/page-contents"] });
    },
  });
}