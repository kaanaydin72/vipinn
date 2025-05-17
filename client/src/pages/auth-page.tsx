import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import MainLayout from "@/components/layout/main-layout";

// Create schema factory function to use translations
function createSchemas(t: Function) {
  const loginFormSchema = z.object({
    username: z.string().min(3, t('username_min_length', 'Kullanıcı adı en az 3 karakter olmalıdır.')),
    password: z.string().min(6, t('password_min_length', 'Şifre en az 6 karakter olmalıdır.')),
  });

  const registerFormSchema = z.object({
    username: z.string().min(3, t('username_min_length', 'Kullanıcı adı en az 3 karakter olmalıdır.')),
    password: z.string().min(6, t('password_min_length', 'Şifre en az 6 karakter olmalıdır.')),
    fullName: z.string().min(3, t('fullname_min_length', 'İsim en az 3 karakter olmalıdır.')),
    email: z.string().email(t('valid_email', 'Geçerli bir e-posta adresi giriniz.')),
    phone: z.string().min(10, t('phone_required', 'Telefon numarası en az 10 karakter olmalıdır.')),
  });

  return { loginFormSchema, registerFormSchema };
}

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();
  
  // Create schemas with translations
  const { loginFormSchema, registerFormSchema } = createSchemas(t);
  
  type LoginFormValues = z.infer<typeof loginFormSchema>;
  type RegisterFormValues = z.infer<typeof registerFormSchema>;
  
  // Forms
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
    },
  });
  
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };
  
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  return (
    <MainLayout pageTitle={""}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Card className="w-full shadow-md border border-neutral-200">
              <CardHeader>
                <CardTitle className="text-2xl font-heading">{t('welcome', 'Hoş Geldiniz')}</CardTitle>
                <CardDescription>
                  {t('auth_description', 'Vipinn Hotels hesabınıza giriş yapın veya yeni bir hesap oluşturun.')}
                </CardDescription>
              </CardHeader>
                
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">{t('login', 'Giriş Yap')}</TabsTrigger>
                  <TabsTrigger value="register">{t('register', 'Üye Ol')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <CardContent className="pt-6">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('username', 'Kullanıcı Adı')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('username_placeholder', 'kullaniciadi')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('password', 'Şifre')}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="********" 
                                    {...field} 
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4 text-neutral-400" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-neutral-400" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending 
                            ? t('logging_in', 'Giriş yapılıyor...') 
                            : t('login', 'Giriş Yap')}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </TabsContent>
                
                <TabsContent value="register">
                  <CardContent className="pt-6">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('full_name', 'Ad Soyad')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('full_name_placeholder', 'Ad Soyad')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('email', 'E-posta')}</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder={t('email_placeholder', 'ornek@mail.com')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('phone_required', 'Telefon')}</FormLabel>
                              <FormControl>
                                <Input placeholder="+90 XXX XXX XX XX" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('username', 'Kullanıcı Adı')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('username_placeholder', 'kullaniciadi')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('password', 'Şifre')}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="********" 
                                    {...field} 
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4 text-neutral-400" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-neutral-400" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending 
                            ? t('registering', 'Kayıt yapılıyor...') 
                            : t('register', 'Üye Ol')}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </TabsContent>
              </Tabs>
              
              <CardFooter className="flex flex-col space-y-2 mt-4">
                <div className="text-sm text-neutral-500 text-center">
                  {t('membership_benefits', 'Vipinn Hotels üyeliği ile özel fırsatlardan yararlanın, rezervasyonlarınızı kolayca yönetin.')}
                </div>
              </CardFooter>
            </Card>
          </div>
          
          <div className="hidden md:block">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold font-heading text-neutral-800">
                {t('vipinn_benefits', 'Vipinn Hotels Ayrıcalıkları')}
              </h2>
              <p className="text-neutral-600">
                {t('vipinn_benefits_description', 'Türkiye\'nin lider otel zinciri Vipinn Hotels\'in sunduğu ayrıcalıklı hizmetler ve konfor için hemen üye olun.')}
              </p>
              
              <div className="space-y-4 mt-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-primary text-white">
                    <i className="fas fa-gift"></i>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-800">{t('special_offers', 'Özel Fırsatlar')}</h3>
                    <p className="mt-1 text-neutral-600">{t('special_offers_description', 'Üyelerimize özel indirimler ve kampanyalar')}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-primary text-white">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-800">{t('quick_booking', 'Hızlı Rezervasyon')}</h3>
                    <p className="mt-1 text-neutral-600">{t('quick_booking_description', 'Tek tıkla oda rezervasyonu yapabilme')}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-primary text-white">
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-800">{t('earn_points', 'Puan Kazanma')}</h3>
                    <p className="mt-1 text-neutral-600">{t('earn_points_description', 'Her konaklamada Vipinn Puan kazanın')}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-primary text-white">
                    <i className="fas fa-percent"></i>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-800">{t('early_booking', 'Erken Rezervasyon')}</h3>
                    <p className="mt-1 text-neutral-600">{t('early_booking_description', 'Erken rezervasyon fırsatlarından öncelikli faydalanma')}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <img 
                  src="https://images.unsplash.com/photo-1564501049412-61c2a3083791" 
                  alt={t('vipinn_hotels', 'Vipinn Hotels')} 
                  className="rounded-lg shadow-lg" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}