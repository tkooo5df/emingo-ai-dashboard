import { useState, useEffect } from 'react';
import { BookmarkPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const AddToHomeScreen = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if dismissed in this session
    if (sessionStorage.getItem('bookmark-dismissed') === 'true') {
      return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Detect Android
    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);

    // Show prompt after delay (only for mobile)
    if (iOS || android) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('bookmark-dismissed', 'true');
  };

  const handleAdd = () => {
    if (isIOS) {
      // iOS instructions
      alert(
        t('bookmark.iosInstructions', 
          'To add to home screen:\n1. Tap the Share button\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add"'
        )
      );
    } else if (isAndroid) {
      // Android - try to trigger add to home screen
      if ((window as any).deferredPrompt) {
        (window as any).deferredPrompt.prompt();
        (window as any).deferredPrompt.userChoice.then(() => {
          (window as any).deferredPrompt = null;
        });
      } else {
        // Show instructions for Android Chrome
        alert(
          t('bookmark.androidInstructions',
            'To add to home screen:\n1. Tap the menu (3 dots)\n2. Tap "Add to Home screen"\n3. Tap "Add"'
          )
        );
      }
    }
    handleDismiss();
  };

  if (!showPrompt || (!isIOS && !isAndroid)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <Card className="p-4 shadow-lg border-2 border-primary/20 bg-card/95 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <img 
                src="/favicon.ico" 
                alt="EMINGO Logo" 
                className="w-6 h-6 md:w-8 md:h-8 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-sm mb-1">
                {t('bookmark.addToHomeScreen', 'Add to Home Screen')}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {isIOS 
                  ? t('bookmark.iosDescription', 'Add EMINGO to your home screen for quick access')
                  : t('bookmark.androidDescription', 'Add EMINGO to your home screen for quick access')
                }
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleAdd}
                  size="sm"
                  className="flex-1 gradient-primary text-white"
                >
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  {t('bookmark.add', 'Add')}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddToHomeScreen;

