import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Award, Star, Heart, MapPin, ThumbsUp, Loader2 } from "lucide-react";
import { useDeviceType } from "@/hooks/use-mobile";
import { usePageContent } from "@/hooks/use-page-content";

// Framer Motion animasyon varyantları
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

const staggered = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

// Varsayılan değerler
const DEFAULT_VALUES = [
  { 
    icon: "Clock", 
    title: "Zamanında Hizmet", 
    description: "Misafirlerimizin değerli zamanına saygı duyar, her türlü hizmetimizi zamanında ve eksiksiz sunmayı taahhüt ederiz."
  },
  { 
    icon: "Award", 
    title: "Kalite", 
    description: "Vipinn Hotels olarak, her detayda en yüksek kaliteyi sunmak için sürekli kendimizi geliştiriyor ve yeniliyoruz."
  },
  { 
    icon: "Star", 
    title: "Mükemmellik", 
    description: "Her misafirimize beş yıldızlı bir deneyim sunmak için tüm standartlarımızı en üst seviyede tutuyoruz."
  },
  { 
    icon: "Heart", 
    title: "Misafir Memnuniyeti", 
    description: "Misafirlerimizin memnuniyeti bizim önceliğimizdir. Her ziyaretinizde beklentilerinizi aşmayı hedefliyoruz."
  },
  { 
    icon: "MapPin", 
    title: "Stratejik Konum", 
    description: "Otellerimiz, şehirlerin en merkezi ve ulaşımı kolay noktalarında konumlandırılmıştır."
  },
  { 
    icon: "ThumbsUp", 
    title: "Güvenilirlik", 
    description: "Vipinn Hotels, güvenilir ve şeffaf hizmet anlayışıyla sektörde öncü bir markadır."
  }
];

const DEFAULT_ABOUT_DATA = {
  hero: {
    title: "Hakkımızda",
    description: "Vipinn Hotels, Türkiye'nin önde gelen lüks otel zinciridir. 2010 yılından bu yana misafirlerimize unutulmaz konaklama deneyimleri sunuyoruz."
  },
  story: {
    title: "Hikayemiz",
    paragraphs: [
      "Vipinn Hotels, 2010 yılında İstanbul'da ilk otelini açarak yolculuğuna başladı. Türkiye'nin lüks otelcilik sektöründe yeni bir çığır açma vizyonuyla kurulan şirketimiz, kısa sürede Türkiye'nin önde gelen otel zincirlerinden biri haline geldi.",
      "Kurulduğumuz günden bu yana, misafirlerimize en üst düzey konfor, kalite ve hizmeti sunmak için çalışıyoruz. Her otelimiz, bulunduğu şehrin ruhunu yansıtacak şekilde tasarlanmış olup, modern mimari ile geleneksel Türk misafirperverliğini bir araya getiriyor.",
      "Bugün, Türkiye'nin 7 farklı şehrinde 15 oteliyle hizmet veren Vipinn Hotels, her yıl binlerce yerli ve yabancı misafiri ağırlıyor. Hedefimiz, Türkiye'nin her köşesinde Vipinn kalitesini sunmak ve global bir marka haline gelmektir."
    ],
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  },
  values: {
    title: "Değerlerimiz",
    items: DEFAULT_VALUES
  },
  mission: {
    title: "Misyonumuz",
    content: "Misafirlerimize ev konforu ile lüks otel deneyimini bir arada sunarak, her ziyaretlerinde kendilerini özel hissettirmek. Türk misafirperverliğini en üst seviyede temsil ederken, sürdürülebilir turizm anlayışıyla çevreye saygılı bir işletmecilik yapmak."
  },
  vision: {
    title: "Vizyonumuz",
    content: "Türkiye'nin küresel ölçekte tanınan ilk otel zinciri olmak ve her şehirde Vipinn imzasını taşıyan bir otel açarak, dünya standartlarında hizmet kalitesini ülkemizin dört bir yanına yaymak."
  },
  statistics: {
    title: "Rakamlarla Vipinn Hotels",
    items: [
      { value: "15", label: "Otel" },
      { value: "7", label: "Şehir" },
      { value: "1200+", label: "Çalışan" },
      { value: "500K+", label: "Mutlu Misafir" }
    ]
  },
  cta: {
    title: "Vipinn Hotels ile Tanışmaya Hazır mısınız?",
    description: "Unutulmaz bir konaklama deneyimi için şimdi rezervasyon yapın.",
    buttonText: "Otelleri Keşfedin",
    buttonUrl: "/hotels"
  }
};

// İkon eşleme
const iconMap: Record<string, any> = {
  Clock,
  Award,
  Star,
  Heart,
  MapPin,
  ThumbsUp
};

export default function AboutPage() {
  const { t } = useTranslation();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  
  const [aboutData, setAboutData] = useState<typeof DEFAULT_ABOUT_DATA>(DEFAULT_ABOUT_DATA);
  
  // Sayfa içeriğini veritabanından getir
  const { data: pageContent, isLoading } = usePageContent('about_us');
  
  // Veritabanından gelen içerik varsa, onu kullan
  useEffect(() => {
    if (pageContent && pageContent.content) {
      try {
        const parsedContent = JSON.parse(pageContent.content);
        setAboutData({
          ...DEFAULT_ABOUT_DATA,
          ...parsedContent
        });
      } catch (error) {
        console.error("Sayfa içeriği JSON formatına dönüştürülemedi:", error);
      }
    }
  }, [pageContent]);
  
  // Değerler için ikon eşleştirmesi yap
  const values = aboutData.values.items.map(value => ({
    ...value,
    icon: iconMap[value.icon as keyof typeof iconMap] || Star // Varsayılan olarak Star ikonu
  }));

  // Yükleme durumu
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        className="w-full min-h-screen"
      >
        {/* Başlık Bölümü - Hero Section */}
        <motion.div 
          className="py-12 px-4 md:py-24 bg-gradient-to-r from-primary/10 to-primary/5"
          variants={fadeInUp}
        >
          <div className="container mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-6 text-primary">
              {aboutData.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-center max-w-3xl mx-auto text-neutral-600 dark:text-neutral-300">
              {aboutData.hero.description}
            </p>
          </div>
        </motion.div>

        {/* Hikayemiz Bölümü */}
        <motion.div 
          className="py-12 px-4"
          variants={fadeInUp}
        >
          <div className="container mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-primary">
              {aboutData.story.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <motion.div variants={fadeInUp}>
                {aboutData.story.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-neutral-600 dark:text-neutral-300 mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </motion.div>
              <motion.div 
                className="rounded-xl overflow-hidden shadow-lg"
                variants={fadeInUp}
              >
                <img 
                  src={aboutData.story.imageUrl} 
                  alt="Vipinn Hotels Kuruluş" 
                  className="w-full h-auto object-cover"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Değerlerimiz Bölümü */}
        <motion.div 
          className="py-12 px-4 bg-neutral-50 dark:bg-neutral-900"
          variants={fadeInUp}
        >
          <div className="container mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-primary">
              {aboutData.values.title}
            </h2>
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggered}
            >
              {values.map((value, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="h-full hover:shadow-xl transition-shadow duration-300 dark:border-neutral-800">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                          <value.icon className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                        <p className="text-neutral-600 dark:text-neutral-400">{value.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Misyon ve Vizyon Bölümü */}
        <motion.div 
          className="py-12 px-4"
          variants={fadeInUp}
        >
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                className="bg-primary/5 p-8 rounded-xl border border-primary/20 dark:bg-primary/10 dark:border-primary/10"
                variants={fadeInUp}
              >
                <h3 className="text-2xl font-bold mb-4 text-primary">{aboutData.mission.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-300">
                  {aboutData.mission.content}
                </p>
              </motion.div>
              <motion.div 
                className="bg-primary/5 p-8 rounded-xl border border-primary/20 dark:bg-primary/10 dark:border-primary/10"
                variants={fadeInUp}
              >
                <h3 className="text-2xl font-bold mb-4 text-primary">{aboutData.vision.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-300">
                  {aboutData.vision.content}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Rakamlarla Vipinn Hotels */}
        <motion.div 
          className="py-12 px-4 bg-primary/5 dark:bg-primary/10"
          variants={fadeInUp}
        >
          <div className="container mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-primary">
              {aboutData.statistics.title}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {aboutData.statistics.items.map((item, index) => (
                <div key={index}>
                  <p className="text-4xl md:text-5xl font-bold text-primary mb-2">{item.value}</p>
                  <p className="text-neutral-600 dark:text-neutral-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* İletişim Çağrısı */}
        <motion.div 
          className="py-12 px-4 bg-primary text-white"
          variants={fadeInUp}
        >
          <div className="container mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{aboutData.cta.title}</h2>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              {aboutData.cta.description}
            </p>
            <a 
              href={aboutData.cta.buttonUrl} 
              className="inline-block bg-white text-primary font-medium px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              {aboutData.cta.buttonText}
            </a>
          </div>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}