import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PlatformLayout } from '@/components/platform/PlatformLayout';
import { Building2, Users, Target, Heart } from 'lucide-react';

export default function AboutUs() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const features = [
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: isRTL ? 'رؤيتنا' : 'Our Vision',
      description: isRTL 
        ? 'تمكين التجارة الإلكترونية في المنطقة من خلال حلول تقنية مبتكرة وموثوقة.'
        : 'Empowering e-commerce in the region through innovative and reliable technical solutions.'
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: isRTL ? 'فريقنا' : 'Our Team',
      description: isRTL
        ? 'نخبة من الخبراء والمطورين الشغوفين ببناء مستقبل التجارة الرقمية.'
        : 'A team of experts and developers passionate about building the future of digital commerce.'
    },
    {
      icon: <Heart className="w-8 h-8 text-primary" />,
      title: isRTL ? 'قيمنا' : 'Our Values',
      description: isRTL
        ? 'الشفافية، الجودة، والالتزام بنجاح عملائنا هي أساس كل ما نقوم به.'
        : 'Transparency, quality, and commitment to our clients\' success are the foundation of everything we do.'
    },
    {
      icon: <Building2 className="w-8 h-8 text-primary" />,
      title: isRTL ? 'تاريخنا' : 'Our History',
      description: isRTL
        ? 'سنوات من الخبرة في تطوير منصات التجارة الإلكترونية وخدمة آلاف التجار.'
        : 'Years of experience in developing e-commerce platforms and serving thousands of merchants.'
    }
  ];

  return (
    <PlatformLayout>
      {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-primary/5">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                {isRTL ? 'من نحن' : 'Who We Are'}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                {isRTL 
                  ? 'نحن منصة "كون"، شريكك الاستراتيجي في رحلة التجارة الإلكترونية. نقدم حلولاً متكاملة تساعدك على النمو والازدهار في السوق الرقمي.'
                  : 'We are "Koun", your strategic partner in the e-commerce journey. We provide integrated solutions that help you grow and thrive in the digital market.'}
              </p>
            </motion.div>
          </div>
          
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-b from-primary/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-t from-primary/20 to-transparent rounded-full blur-3xl" />
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md"
                >
                  <div className="mb-4 p-3 bg-primary/10 w-fit rounded-xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-primary/5 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { label: isRTL ? 'عميل سعيد' : 'Happy Clients', value: '+10k' },
                { label: isRTL ? 'متجر إلكتروني' : 'Online Stores', value: '+5000' },
                { label: isRTL ? 'طلب مكتمل' : 'Completed Orders', value: '+1M' },
                { label: isRTL ? 'سنة خبرة' : 'Years Experience', value: '+5' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
      </section>
    </PlatformLayout>
  );
}
