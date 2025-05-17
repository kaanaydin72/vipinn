import MainLayout from "@/components/layout/main-layout";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AtSign,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Send,
  Mail,
  Clock,
} from "lucide-react";
import { useDeviceType } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Framer Motion animasyon varyantları
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, delay: 0.1 },
  },
};

const staggered = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Form şeması
const formSchema = z.object({
  name: z.string().min(3, {
    message: "İsim en az 3 karakter olmalıdır.",
  }),
  email: z.string().email({
    message: "Geçerli bir e-posta adresi giriniz.",
  }),
  subject: z.string().min(5, {
    message: "Konu en az 5 karakter olmalıdır.",
  }),
  message: z.string().min(10, {
    message: "Mesaj en az 10 karakter olmalıdır.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContactPage() {
  const { t } = useTranslation();
  const deviceType = useDeviceType();
  const isMobile = deviceType === "mobile";
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form hook
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  // Form gönderme işlemi
  function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    // Gerçek senaryoda bu kısım bir API endpoint'ine istek yapacaktır
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Mesajınız gönderildi",
        description: "En kısa sürede size dönüş yapacağız.",
        variant: "default",
      });
      form.reset();
    }, 1500);
  }

  // İletişim bilgileri
  const contactInfo = [
    {
      icon: Mail,
      title: "E-posta",
      info: "info@vipinnhotels.com",
    },
    {
      icon: Phone,
      title: "Telefon",
      info: "+9 0549 628 10 20",
    },
    {
      icon: MapPin,
      title: "Adres",
      info: "Levent, 34330 Beşiktaş/İstanbul",
    },
  ];

  // Sosyal medya linkleri
  const socialMedia = [
    {
      icon: Facebook,
      name: "Facebook",
      url: "https://facebook.com/vipinnhotels",
    },
    {
      icon: Instagram,
      name: "Instagram",
      url: "https://instagram.com/vipinnhotels",
    },
    { icon: Twitter, name: "Twitter", url: "https://twitter.com/vipinnhotels" },
  ];

  return (
    <MainLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        className="w-full min-h-screen"
      >
        {/* Başlık Bölümü - Hero Section */}
        <motion.div
          className="py-12 px-4 md:py-20 bg-gradient-to-r from-primary/10 to-primary/5"
          variants={fadeInUp}
        >
          <div className="container mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-6 text-primary">
              {t("contact_us")}
            </h1>
            <p className="text-lg md:text-xl text-center max-w-3xl mx-auto text-neutral-600 dark:text-neutral-300">
              Vipinn Hotels'e ulaşmak için aşağıdaki iletişim kanallarını
              kullanabilir veya iletişim formunu doldurabilirsiniz.
            </p>
          </div>
        </motion.div>

        {/* Ana İçerik Bölümü */}
        <motion.div className="py-12 px-4" variants={fadeInUp}>
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* İletişim Formu */}
              <motion.div variants={fadeInUp} className="order-2 lg:order-1">
                <h2 className="text-2xl font-bold mb-6 text-primary">
                  İletişim Formu
                </h2>
                <Card className="border-primary/20 shadow-md">
                  <CardContent className="pt-6">
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Adınız Soyadınız</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Adınız Soyadınız"
                                    {...field}
                                    className="border-primary/20 focus:border-primary"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>E-posta Adresiniz</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="ornek@mail.com"
                                    type="email"
                                    {...field}
                                    className="border-primary/20 focus:border-primary"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Konu</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Mesajınızın konusu"
                                  {...field}
                                  className="border-primary/20 focus:border-primary"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesajınız</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Bize iletmek istediğiniz mesajı yazın"
                                  {...field}
                                  rows={5}
                                  className="resize-none border-primary/20 focus:border-primary"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-white"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <span className="mr-2">Gönderiliyor</span>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Gönder
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* İletişim Bilgileri */}
              <motion.div variants={fadeInUp} className="order-1 lg:order-2">
                <h2 className="text-2xl font-bold mb-6 text-primary">
                  İletişim Bilgilerimiz
                </h2>
                <Card className="border-primary/20 shadow-md mb-8">
                  <CardContent className="pt-6">
                    <motion.div variants={staggered} className="space-y-6">
                      {contactInfo.map((item, index) => (
                        <motion.div
                          key={index}
                          variants={fadeInUp}
                          className="flex items-start"
                        >
                          <div className="bg-primary/10 p-3 rounded-full mr-4">
                            <item.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">
                              {item.title}
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400">
                              {item.info}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardContent>
                </Card>

                <h2 className="text-2xl font-bold mb-6 text-primary">
                  Sosyal Medya
                </h2>
                <Card className="border-primary/20 shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                      {socialMedia.map((item, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          asChild
                          className="border-primary/20 hover:bg-primary/10"
                        >
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <item.icon className="h-5 w-5 mr-2 text-primary" />
                            {item.name}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Harita Bölümü */}
        <motion.div
          className="py-8 px-4 bg-neutral-50 dark:bg-neutral-900"
          variants={fadeInUp}
        >
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-primary text-center">
              Bizi Ziyaret Edin
            </h2>
            <div className="rounded-xl overflow-hidden shadow-lg h-[400px] border border-primary/20">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.225552001907!2d29.00673375!3d41.050803800000005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab7a2a2c3b963%3A0x7671d1b9817b8519!2zTGV2ZW50LCBCZcWfaWt0YcWfL8Swc3RhbmJ1bA!5e0!3m2!1str!2str!4v1651234567890!5m2!1str!2str"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
