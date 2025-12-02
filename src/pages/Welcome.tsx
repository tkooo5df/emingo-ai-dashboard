import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, TrendingUp, Shield, Sparkles, Zap, Target, PiggyBank, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Welcome = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const slides = [
    {
      icon: TrendingUp,
      title: t('welcome.slide1.title', 'Track Your Finances'),
      description: t('welcome.slide1.desc', 'Monitor income, expenses, and savings all in one beautiful dashboard'),
      color: 'from-primary to-accent',
      gradient: 'bg-gradient-to-br from-primary/20 to-accent/20'
    },
    {
      icon: Brain,
      title: t('welcome.slide2.title', 'AI-Powered Insights'),
      description: t('welcome.slide2.desc', 'Get personalized financial advice and smart recommendations'),
      color: 'from-accent to-success',
      gradient: 'bg-gradient-to-br from-accent/20 to-success/20'
    },
    {
      icon: Target,
      title: t('welcome.slide3.title', 'Achieve Your Goals'),
      description: t('welcome.slide3.desc', 'Set financial goals and track your progress with ease'),
      color: 'from-success to-primary',
      gradient: 'bg-gradient-to-br from-success/20 to-primary/20'
    },
    {
      icon: Shield,
      title: t('welcome.slide4.title', 'Secure & Private'),
      description: t('welcome.slide4.desc', 'Your data is encrypted and protected with industry-standard security'),
      color: 'from-primary to-success',
      gradient: 'bg-gradient-to-br from-primary/20 to-success/20'
    }
  ];

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('hasSeenWelcome', 'true');
      navigate('/');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-success/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-success/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Logo at top */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="flex justify-center mb-4"
          >
            <div className="w-24 h-24 flex items-center justify-center">
              <img 
                src="/favicon.ico" 
                alt="EMINGO Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
          <h1 className="text-5xl font-display font-bold bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
            EMINGO
          </h1>
          <p className="text-muted-foreground mt-2">Your Intelligent Financial Companion</p>
        </motion.div>

        <Card className="glass-card p-8 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Icon and content */}
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${slides[currentStep].color} flex items-center justify-center shadow-2xl`}>
                    {slides[currentStep].icon && <slides[currentStep].icon className="w-16 h-16 text-white" />}
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-display font-bold">
                    {slides[currentStep].title}
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {slides[currentStep].description}
                  </p>
                </div>

                {/* Features list for current slide */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8"
                >
                  {currentStep === 0 && (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <PiggyBank className="w-6 h-6 text-primary" />
                        <span className="text-sm">Smart Savings</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                        <Sparkles className="w-6 h-6 text-accent" />
                        <span className="text-sm">Analytics</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                        <TrendingUp className="w-6 h-6 text-success" />
                        <span className="text-sm">Growth Tracking</span>
                      </div>
                    </>
                  )}
                  {currentStep === 1 && (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                        <Brain className="w-6 h-6 text-accent" />
                        <span className="text-sm">Smart AI</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                        <Zap className="w-6 h-6 text-success" />
                        <span className="text-sm">Quick Tips</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <span className="text-sm">Personalized</span>
                      </div>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                        <Target className="w-6 h-6 text-success" />
                        <span className="text-sm">Goal Setting</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        <span className="text-sm">Progress Tracking</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                        <Sparkles className="w-6 h-6 text-accent" />
                        <span className="text-sm">Achievements</span>
                      </div>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <Shield className="w-6 h-6 text-primary" />
                        <span className="text-sm">Encrypted</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                        <Zap className="w-6 h-6 text-success" />
                        <span className="text-sm">Fast & Secure</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                        <Sparkles className="w-6 h-6 text-accent" />
                        <span className="text-sm">Privacy First</span>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentStep 
                        ? 'w-8 bg-gradient-to-r from-primary via-accent to-success' 
                        : 'w-2 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-4 justify-between items-center pt-6">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip
                </Button>

                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-primary via-accent to-success text-white px-8 hover:opacity-90 transition-opacity"
                  size="lg"
                >
                  {currentStep === slides.length - 1 ? (
                    'Get Started'
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          {currentStep + 1} of {slides.length}
        </motion.p>
      </div>
    </div>
  );
};

export default Welcome;

