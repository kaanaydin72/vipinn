import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  UserPlus,
  Pencil,
  Trash2,
  Search,
  SlidersHorizontal,
  UserCog,
  Mail,
  UserCheck,
  Shield,
  LockKeyhole,
  Loader2,
} from "lucide-react";

export default function UserManagementMobile() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [newUserDialog, setNewUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string; isAdmin: boolean }) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Kullanıcı oluşturuldu",
        description: "Yeni kullanıcı başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      resetForm();
      setNewUserDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kullanıcı oluşturulurken hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
      return userId;
    },
    onSuccess: () => {
      toast({
        title: "Kullanıcı silindi",
        description: "Kullanıcı başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Kullanıcı silinirken hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setIsAdmin(false);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      toast({
        title: "Uyarı",
        description: "Tüm alanları doldurun.",
        variant: "destructive",
      });
      return;
    }
    
    createUserMutation.mutate({
      username,
      email,
      password,
      isAdmin,
    });
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* iOS/Android tarzı başlık */}
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
          <div className="flex items-center px-4 h-14">
            <Button variant="ghost" size="icon" className="text-white" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="flex-1 text-center font-semibold text-lg">Kullanıcı Yönetimi</h1>
            <Button
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={() => setNewUserDialog(true)}
            >
              <UserPlus className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Arama */}
        <div className="px-4 py-3 bg-white shadow-sm border-b flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Kullanıcı ara..."
              className="pl-9 h-10 bg-neutral-50 border-[#2094f3]/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 border-[#2094f3]/20">
            <SlidersHorizontal className="h-4 w-4 text-neutral-500" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#2094f3]" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-neutral-600">
            <UserCog className="h-12 w-12 mx-auto mb-2 text-neutral-300" />
            <p className="text-lg font-medium">Kullanıcı bulunamadı</p>
            <p className="text-sm mb-4">Aramayı değiştirin veya yeni bir kullanıcı ekleyin</p>
            <Button
              onClick={() => setNewUserDialog(true)}
              className="bg-[#2094f3]"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Yeni Kullanıcı Ekle
            </Button>
          </div>
        ) : (
          <motion.div 
            className="space-y-4 pb-16"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {filteredUsers.map((user) => (
              <motion.div key={user.id} variants={itemVariants}>
                <Card className="overflow-hidden border-[#2094f3]/20 bg-white rounded-xl shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium">{user.username}</h3>
                          <div className="flex items-center text-xs text-neutral-500 mt-0.5">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email || "E-posta yok"}
                          </div>
                        </div>
                      </div>
                      <Badge variant={user.isAdmin ? "outline" : "secondary"} className={user.isAdmin ? "bg-blue-50 text-blue-700 border-blue-200" : ""}>
                        <Shield className={`h-3 w-3 mr-1 ${user.isAdmin ? "text-blue-700" : ""}`} />
                        {user.isAdmin ? "Yönetici" : "Kullanıcı"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 text-blue-600 border-blue-200"
                      >
                        <LockKeyhole className="h-3.5 w-3.5 mr-1.5" />
                        Şifre Sıfırla
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-red-600 border-red-200"
                        onClick={() => {
                          setUserToDelete(user);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Sil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      
      {/* Yeni Kullanıcı Dialog */}
      <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
            <DialogDescription>
              Sisteme erişebilecek yeni bir kullanıcı oluşturun.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                placeholder="Kullanıcı adı girin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="E-posta girin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="Şifre girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAdmin"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isAdmin" className="cursor-pointer">Yönetici yetkisi ver</Label>
            </div>
            <DialogFooter className="mt-2 gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  resetForm();
                  setNewUserDialog(false);
                }}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                className="bg-[#2094f3]"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Kullanıcı Oluştur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Kullanıcı Silme Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete?.username} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Kullanıcıyı Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}