import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, UserPlus, Pencil, Trash2, Shield, ShieldOff, Mail, Phone, User as UserIcon } from "lucide-react";

// Form şemaları
const userFormSchema = z.object({
  username: z.string().min(3, {
    message: "Kullanıcı adı en az 3 karakter olmalıdır.",
  }),
  email: z.string().email({
    message: "Geçerli bir e-posta adresi giriniz.",
  }),
  password: z.string().min(6, {
    message: "Şifre en az 6 karakter olmalıdır.",
  }),
  fullName: z.string().min(2, {
    message: "Ad soyad en az 2 karakter olmalıdır.",
  }),
  phone: z.string().optional(),
  isAdmin: z.boolean(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Kullanıcılar için query
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Kullanıcılar alınamadı");
      }
      return response.json();
    },
  });

  // Form hookları
  const addForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      phone: "",
      isAdmin: false,
    },
  });

  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      phone: "",
      isAdmin: false,
    },
  });

  // Kullanıcı ekleme mutasyonu
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/users", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Kullanıcı eklendi",
        description: "Yeni kullanıcı başarıyla oluşturuldu.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Kullanıcı güncelleme mutasyonu
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormValues & { id: number }) => {
      const { id, ...userData } = data;
      const res = await apiRequest("PUT", `/api/users/${id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: "Kullanıcı güncellendi",
        description: "Kullanıcı bilgileri başarıyla güncellendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Kullanıcı silme mutasyonu
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Kullanıcı silindi",
        description: "Kullanıcı başarıyla silindi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form işlemleri
  const handleAddSubmit = (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };

  const handleEditSubmit = (data: UserFormValues) => {
    if (selectedUser) {
      updateUserMutation.mutate({ ...data, id: selectedUser.id });
    }
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      username: user.username,
      email: user.email,
      password: "", // Şifreyi boş bırak, değiştirilmek istenirse doldurulur
      fullName: user.fullName,
      phone: user.phone || "",
      isAdmin: user.isAdmin,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
        {/* Mobil top padding */}
        <div className="h-16 md:hidden"></div>
        
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-neutral-800 dark:text-white">Kullanıcı Yönetimi</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Yeni Kullanıcı Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                  <DialogDescription>
                    Sisteme yeni bir kullanıcı eklemek için formu doldurun.
                  </DialogDescription>
                </DialogHeader>
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-4">
                    <FormField
                      control={addForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kullanıcı Adı</FormLabel>
                          <FormControl>
                            <Input placeholder="kullanici_adi" {...field} />
                          </FormControl>
                          <FormDescription>
                            Sisteme giriş için kullanılacak kullanıcı adı
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-posta</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="ornek@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Soyad</FormLabel>
                          <FormControl>
                            <Input placeholder="Ahmet Yılmaz" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon (Opsiyonel)</FormLabel>
                          <FormControl>
                            <Input placeholder="+90 555 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="isAdmin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yetki Seviyesi</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value === "admin")}
                            defaultValue={field.value ? "admin" : "user"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Yetki seviyesi seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">Normal Kullanıcı</SelectItem>
                              <SelectItem value="admin">Yönetici</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Yöneticiler tüm sistem özelliklerine erişebilir
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createUserMutation.isPending}
                      >
                        {createUserMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Kullanıcı Ekle
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kullanıcılar</CardTitle>
              <CardDescription>
                Sistem kullanıcılarının listesi ve yönetimi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Desktop tablo görünümü */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kullanıcı</TableHead>
                          <TableHead>E-posta</TableHead>
                          <TableHead>Telefon</TableHead>
                          <TableHead>Yetki</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              Henüz kullanıcı bulunmamaktadır. Yeni bir kullanıcı ekleyin.
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    {user.fullName.charAt(0) || user.username.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-medium">{user.fullName}</div>
                                    <div className="text-sm text-neutral-500">@{user.username}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="flex items-center gap-1">
                                <Mail className="h-4 w-4 text-neutral-500" />
                                {user.email}
                              </TableCell>
                              <TableCell>
                                {user.phone ? (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-4 w-4 text-neutral-500" />
                                    {user.phone}
                                  </span>
                                ) : (
                                  <span className="text-neutral-400">--</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {user.isAdmin ? (
                                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                    <Shield className="h-3 w-3 mr-1" /> Yönetici
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    <UserIcon className="h-3 w-3 mr-1" /> Kullanıcı
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDialog(user)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openDeleteDialog(user)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Mobil kart görünümü */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {users.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500">
                        Henüz kullanıcı bulunmamaktadır. Yeni bir kullanıcı ekleyin.
                      </div>
                    ) : (
                      users.map((user) => (
                        <Card key={user.id} className="overflow-hidden border">
                          <CardHeader className="p-4 pb-2 flex justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                {user.fullName.charAt(0) || user.username.charAt(0)}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{user.fullName}</CardTitle>
                                <CardDescription>@{user.username}</CardDescription>
                              </div>
                            </div>
                            <div>
                              {user.isAdmin ? (
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                  <Shield className="h-3 w-3 mr-1" /> Yönetici
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <UserIcon className="h-3 w-3 mr-1" /> Kullanıcı
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <div className="flex flex-col space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-neutral-500" />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-neutral-500" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <div className="p-2 bg-neutral-50 dark:bg-neutral-800 flex justify-end gap-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Düzenle
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(user)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Sil
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
                <DialogDescription>
                  Kullanıcı bilgilerini güncellemek için formu kullanın.
                </DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kullanıcı Adı</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şifre (Değiştirmek için doldurun)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Şifreyi değiştirmek için doldurun" {...field} />
                        </FormControl>
                        <FormDescription>
                          Boş bırakırsanız şifre değişmeyecektir
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad Soyad</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon (Opsiyonel)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="isAdmin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yetki Seviyesi</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "admin")}
                          defaultValue={field.value ? "admin" : "user"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Yetki seviyesi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">Normal Kullanıcı</SelectItem>
                            <SelectItem value="admin">Yönetici</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Değişiklikleri Kaydet
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Delete User Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Kullanıcıyı Sil</DialogTitle>
                <DialogDescription>
                  Bu işlem geri alınamaz. Kullanıcıyı silmek istediğinizden emin misiniz?
                </DialogDescription>
              </DialogHeader>
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-md p-4 my-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    {selectedUser?.fullName.charAt(0) || selectedUser?.username.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{selectedUser?.fullName}</div>
                    <div className="text-sm text-neutral-500">@{selectedUser?.username}</div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={deleteUserMutation.isPending}
                >
                  {deleteUserMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Kullanıcıyı Sil
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}