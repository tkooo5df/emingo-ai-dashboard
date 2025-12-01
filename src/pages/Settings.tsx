import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  DollarSign, 
  Tag, 
  CreditCard,
  BarChart3,
  Plus,
  X,
  Save,
  User,
  FileText,
  Languages,
  // Category Icons
  Coffee,
  ShoppingBag,
  Car,
  Home,
  UtensilsCrossed,
  Plane,
  Gamepad2,
  GraduationCap,
  Briefcase,
  Heart,
  Stethoscope,
  Dumbbell,
  Music,
  Film,
  Book,
  Wifi,
  Zap,
  Droplet,
  Shirt,
  Gift,
  Baby,
  Dog,
  Camera,
  Smartphone,
  Laptop,
  Building2,
  TreePine,
  Sun,
  Moon,
  Palette,
  Code,
  Paintbrush,
  Hammer,
  Wrench,
  Scissors,
  ShoppingCart,
  Receipt,
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Star,
  Sparkles,
  type LucideIcon
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface Category {
  id: string;
  name: string;
  icon: string; // Icon name from lucide-react
  type?: 'income' | 'expense' | 'both';
}

interface Settings {
  currency: string;
  custom_categories: Category[];
  accounts: Array<{
    id: string;
    name: string;
    type: 'ccp' | 'cash' | 'creditcard';
  }>;
  analytics_preferences: {
    showCharts?: boolean;
    showTrends?: boolean;
    showProjections?: boolean;
  };
}

// Available icons for categories
const AVAILABLE_ICONS: Array<{ name: string; icon: LucideIcon; label: string }> = [
  { name: 'Coffee', icon: Coffee, label: 'Coffee' },
  { name: 'ShoppingBag', icon: ShoppingBag, label: 'Shopping' },
  { name: 'Car', icon: Car, label: 'Transport' },
  { name: 'Home', icon: Home, label: 'Home' },
  { name: 'UtensilsCrossed', icon: UtensilsCrossed, label: 'Food' },
  { name: 'Plane', icon: Plane, label: 'Travel' },
  { name: 'Gamepad2', icon: Gamepad2, label: 'Gaming' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Education' },
  { name: 'Briefcase', icon: Briefcase, label: 'Work' },
  { name: 'Heart', icon: Heart, label: 'Health' },
  { name: 'Stethoscope', icon: Stethoscope, label: 'Medical' },
  { name: 'Dumbbell', icon: Dumbbell, label: 'Fitness' },
  { name: 'Music', icon: Music, label: 'Music' },
  { name: 'Film', icon: Film, label: 'Entertainment' },
  { name: 'Book', icon: Book, label: 'Books' },
  { name: 'Wifi', icon: Wifi, label: 'Internet' },
  { name: 'Zap', icon: Zap, label: 'Electricity' },
  { name: 'Droplet', icon: Droplet, label: 'Water' },
  { name: 'Shirt', icon: Shirt, label: 'Clothing' },
  { name: 'Gift', icon: Gift, label: 'Gifts' },
  { name: 'Baby', icon: Baby, label: 'Baby' },
  { name: 'Dog', icon: Dog, label: 'Pets' },
  { name: 'Camera', icon: Camera, label: 'Photography' },
  { name: 'Smartphone', icon: Smartphone, label: 'Phone' },
  { name: 'Laptop', icon: Laptop, label: 'Tech' },
  { name: 'Building2', icon: Building2, label: 'Rent' },
  { name: 'TreePine', icon: TreePine, label: 'Nature' },
  { name: 'Sun', icon: Sun, label: 'Weather' },
  { name: 'Moon', icon: Moon, label: 'Night' },
  { name: 'Palette', icon: Palette, label: 'Art' },
  { name: 'Code', icon: Code, label: 'Development' },
  { name: 'Paintbrush', icon: Paintbrush, label: 'Design' },
  { name: 'Hammer', icon: Hammer, label: 'Tools' },
  { name: 'Wrench', icon: Wrench, label: 'Maintenance' },
  { name: 'Scissors', icon: Scissors, label: 'Haircut' },
  { name: 'ShoppingCart', icon: ShoppingCart, label: 'Groceries' },
  { name: 'Receipt', icon: Receipt, label: 'Bills' },
  { name: 'Wallet', icon: Wallet, label: 'Wallet' },
  { name: 'PiggyBank', icon: PiggyBank, label: 'Savings' },
  { name: 'TrendingUp', icon: TrendingUp, label: 'Income' },
  { name: 'TrendingDown', icon: TrendingDown, label: 'Expense' },
  { name: 'Target', icon: Target, label: 'Goals' },
  { name: 'Award', icon: Award, label: 'Awards' },
  { name: 'Star', icon: Star, label: 'Favorites' },
  { name: 'Sparkles', icon: Sparkles, label: 'Special' },
  { name: 'Tag', icon: Tag, label: 'Other' },
];

// Default categories with icons
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Freelancing', icon: 'Briefcase', type: 'income' },
  { id: '2', name: 'Digital Services', icon: 'Code', type: 'income' },
  { id: '3', name: 'Design Work', icon: 'Paintbrush', type: 'income' },
  { id: '4', name: 'Consulting', icon: 'GraduationCap', type: 'income' },
  { id: '5', name: 'Food', icon: 'UtensilsCrossed', type: 'expense' },
  { id: '6', name: 'Transport', icon: 'Car', type: 'expense' },
  { id: '7', name: 'Internet', icon: 'Wifi', type: 'expense' },
  { id: '8', name: 'Study Costs', icon: 'Book', type: 'expense' },
  { id: '9', name: 'Work Tools', icon: 'Hammer', type: 'expense' },
  { id: '10', name: 'Personal', icon: 'Heart', type: 'expense' },
  { id: '11', name: 'Entertainment', icon: 'Film', type: 'expense' },
  { id: '12', name: 'Shopping', icon: 'ShoppingBag', type: 'expense' },
  { id: '13', name: 'Health', icon: 'Stethoscope', type: 'expense' },
  { id: '14', name: 'Home', icon: 'Home', type: 'expense' },
  { id: '15', name: 'Other', icon: 'Tag', type: 'both' },
];

const CURRENCIES = [
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'دج' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' },
];

const ACCOUNT_TYPES = [
  { value: 'ccp', label: 'Bank Account (CCP)' },
  { value: 'cash', label: 'Cash' },
  { value: 'creditcard', label: 'Credit Card' },
];

const Settings = () => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [languageKey, setLanguageKey] = useState(0); // Force re-render on language change
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language); // Track current language
  
  // Listen to language changes and force re-render
  useEffect(() => {
    console.log('🌐 [Settings] Setting up language change listener, current language:', i18n.language);
    
    const handleLanguageChange = (lng: string) => {
      console.log('🌐 [Settings] Language change detected in Settings component:', {
        from: currentLanguage,
        to: lng,
        i18nLanguage: i18n.language,
        timestamp: new Date().toISOString()
      });
      setCurrentLanguage(lng);
      setLanguageKey(prev => {
        const newKey = prev + 1;
        console.log('🌐 [Settings] Updating language key from', prev, 'to', newKey);
        return newKey;
      });
      console.log('🌐 [Settings] Component will re-render with new language');
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    console.log('🌐 [Settings] Language change listener registered');
    
    return () => {
      console.log('🌐 [Settings] Cleaning up language change listener');
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);
  
  // Update currentLanguage when i18n.language changes (fallback)
  useEffect(() => {
    if (i18n.language !== currentLanguage) {
      console.log('🌐 [Settings] i18n.language changed, updating currentLanguage:', {
        from: currentLanguage,
        to: i18n.language
      });
      setCurrentLanguage(i18n.language);
      setLanguageKey(prev => prev + 1);
    }
  }, [i18n.language, currentLanguage]);
  const [settings, setSettings] = useState<Settings>({
    currency: 'DZD',
    custom_categories: [],
    accounts: [],
    analytics_preferences: {
      showCharts: true,
      showTrends: true,
      showProjections: true,
    },
  });

  const [newCategory, setNewCategory] = useState({ name: '', icon: 'Tag', type: 'both' as 'income' | 'expense' | 'both' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newAccount, setNewAccount] = useState({ name: '', type: 'ccp' as const });
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    current_work: '',
    description: ''
  });

  useEffect(() => {
    loadSettings();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('📥 [SETTINGS] Loading profile...');
      const data = await api.getProfile();
      console.log('✅ [SETTINGS] Profile loaded:', data);
      setProfile({
        name: data.name || '',
        age: data.age ? String(data.age) : '',
        current_work: data.current_work || '',
        description: data.description || ''
      });
      console.log('✅ [SETTINGS] Profile state updated:', {
        name: data.name || '',
        age: data.age ? String(data.age) : '',
        current_work: data.current_work || '',
        description: data.description || ''
      });
    } catch (error) {
      console.error('❌ [SETTINGS] Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      console.log('💾 [SETTINGS] Saving profile:', {
        name: profile.name || null,
        age: profile.age ? parseInt(profile.age) : null,
        current_work: profile.current_work || null,
        description: profile.description || null,
      });
      
      await api.saveProfile({
        name: profile.name || null,
        age: profile.age ? parseInt(profile.age) : null,
        current_work: profile.current_work || null,
        description: profile.description || null,
      });
      
      console.log('✅ [SETTINGS] Profile saved successfully, reloading...');
      
      // Reload profile from database to ensure UI is in sync
      await loadProfile();
      
      toast({
        title: 'Profile Saved',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      console.error('❌ [SETTINGS] Error saving profile:', error);
      toast({
        title: 'Error Saving Profile',
        description: 'Could not save your profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      
      // Convert old string array to new Category array if needed
      let categories: Category[] = [];
      if (data.custom_categories && Array.isArray(data.custom_categories)) {
        if (data.custom_categories.length > 0 && typeof data.custom_categories[0] === 'string') {
          // Old format: string array - convert to Category array
          categories = (data.custom_categories as string[]).map((name, index) => ({
            id: `cat-${index}`,
            name,
            icon: 'Tag',
            type: 'both'
          }));
        } else {
          // New format: Category array
          categories = data.custom_categories as Category[];
        }
      }
      
      // If no categories, use defaults
      if (categories.length === 0) {
        categories = DEFAULT_CATEGORIES;
      }
      
      setSettings({
        currency: data.currency || 'DZD',
        language: data.language || 'en',
        custom_categories: categories,
        accounts: data.accounts || [],
        analytics_preferences: data.analytics_preferences || {
          showCharts: true,
          showTrends: true,
          showProjections: true,
        },
      });
      
      // Update i18n language if it's different (database has priority)
      console.log('🌐 [Settings] Loading settings from database...');
      if (data.language) {
        console.log('🌐 [Settings] Language found in database:', {
          dbLanguage: data.language,
          currentI18n: i18n.language,
          currentLocalStorage: localStorage.getItem('i18nextLng'),
          needsUpdate: data.language !== i18n.language
        });
        
        if (data.language !== i18n.language) {
          console.log('🔄 [Settings] Updating i18n language from', i18n.language, 'to', data.language);
          await i18n.changeLanguage(data.language);
          localStorage.setItem('i18nextLng', data.language);
          // Update document direction
          document.documentElement.dir = data.language === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = data.language;
          console.log('✅ [Settings] Language updated successfully:', {
            i18n: i18n.language,
            localStorage: localStorage.getItem('i18nextLng'),
            documentDir: document.documentElement.dir
          });
        } else {
          console.log('✅ [Settings] Language already matches, no update needed');
        }
      } else {
        // If no language in database, save current i18n language to database
        const currentLang = i18n.language || 'en';
        console.log('⚠️ [Settings] No language in database, saving current language:', currentLang);
        try {
          await api.updateSettings({
            ...data,
            language: currentLang
          });
          console.log('✅ [Settings] Default language saved to database:', currentLang);
        } catch (error) {
          console.error('❌ [Settings] Error saving default language:', error);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use defaults if loading fails
      setSettings({
        currency: 'DZD',
        custom_categories: DEFAULT_CATEGORIES,
        accounts: [],
        analytics_preferences: {
          showCharts: true,
          showTrends: true,
          showProjections: true,
        },
      });
      toast({
        title: 'Error Loading Settings',
        description: 'Could not load your settings. Using defaults.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.saveSettings(settings);
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error Saving Settings',
        description: 'Could not save your settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (newCategory.name.trim()) {
      const categoryExists = settings.custom_categories.some(
        c => c.name.toLowerCase() === newCategory.name.trim().toLowerCase()
      );
      
      if (categoryExists) {
        toast({
          title: 'Category Exists',
          description: 'A category with this name already exists.',
          variant: 'destructive',
        });
        return;
      }

      const newCat: Category = {
        id: crypto.randomUUID(),
        name: newCategory.name.trim(),
        icon: newCategory.icon,
        type: newCategory.type,
      };

      setSettings({
        ...settings,
        custom_categories: [...settings.custom_categories, newCat],
      });
      setNewCategory({ name: '', icon: 'Tag', type: 'both' });
    }
  };

  const updateCategory = (category: Category) => {
    setSettings({
      ...settings,
      custom_categories: settings.custom_categories.map(c =>
        c.id === category.id ? category : c
      ),
    });
    setEditingCategory(null);
  };

  const removeCategory = (id: string) => {
    setSettings({
      ...settings,
      custom_categories: settings.custom_categories.filter(c => c.id !== id),
    });
  };

  const getIconComponent = (iconName: string): LucideIcon => {
    const iconData = AVAILABLE_ICONS.find(i => i.name === iconName);
    return iconData ? iconData.icon : Tag;
  };

  const addAccount = () => {
    if (newAccount.name.trim()) {
      setSettings({
        ...settings,
        accounts: [
          ...settings.accounts,
          {
            id: crypto.randomUUID(),
            name: newAccount.name.trim(),
            type: newAccount.type,
          },
        ],
      });
      setNewAccount({ name: '', type: 'ccp' });
    }
  };

  const removeAccount = (id: string) => {
    setSettings({
      ...settings,
      accounts: settings.accounts.filter(a => a.id !== id),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div key={`settings-${languageKey}-${i18n.language}`} className="space-y-4 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-4xl font-display font-bold mb-1 md:mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? t('settings.saving') : t('settings.saveSettings')}
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Profile Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('settings.profileInformation')}
            </CardTitle>
            <CardDescription>
              {t('settings.profileDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile-name">{t('settings.profileName')} *</Label>
                <Input
                  id="profile-name"
                  placeholder={t('settings.profileNamePlaceholder')}
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="profile-age">{t('settings.profileAge')}</Label>
                <Input
                  id="profile-age"
                  type="number"
                  placeholder={t('settings.profileAgePlaceholder')}
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  min="1"
                  max="120"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="profile-work">{t('settings.profileWork')}</Label>
                <Input
                  id="profile-work"
                  placeholder={t('settings.profileWorkPlaceholder')}
                  value={profile.current_work}
                  onChange={(e) => setProfile({ ...profile, current_work: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="profile-description">{t('settings.profileAbout')}</Label>
                <textarea
                  id="profile-description"
                  placeholder={t('settings.profileAboutPlaceholder')}
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg bg-background resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={saveProfile} disabled={saving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? t('settings.saving') : t('common.save')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {t('settings.currency')}
            </CardTitle>
            <CardDescription>
              {t('settings.currencyDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('settings.currency')}</Label>
              <select
                id="currency"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              {t('settings.language')}
            </CardTitle>
            <CardDescription>
              {t('settings.languageDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">{t('settings.language')}</Label>
              <select
                id="language"
                value={settings.language || i18n.language}
                onChange={async (e) => {
                  const newLanguage = e.target.value;
                  const previousLanguage = settings.language || i18n.language;
                  
                  console.log('🌐 [Settings] Language change initiated:', {
                    from: previousLanguage,
                    to: newLanguage,
                    timestamp: new Date().toISOString()
                  });
                  
                  // Update state first to trigger immediate UI update
                  setSettings({ ...settings, language: newLanguage });
                  console.log('🌐 [Settings] State updated with new language');
                  
                  // Change language immediately (triggers re-render via i18n event)
                  console.log('🌐 [Settings] Calling i18n.changeLanguage...');
                  await i18n.changeLanguage(newLanguage);
                  localStorage.setItem('i18nextLng', newLanguage);
                  console.log('🌐 [Settings] i18n and localStorage updated:', {
                    i18n: i18n.language,
                    localStorage: localStorage.getItem('i18nextLng')
                  });
                  
                  // Update document direction for RTL
                  document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
                  document.documentElement.lang = newLanguage;
                  console.log('🌐 [Settings] Document direction updated:', {
                    dir: document.documentElement.dir,
                    lang: document.documentElement.lang
                  });
                  
                  // Force re-render by updating key
                  setLanguageKey(prev => prev + 1);
                  
                  // Save to database FIRST (blocking) to ensure it's saved
                  try {
                    console.log('💾 [Settings] Saving language to database...', {
                      language: newLanguage,
                      settings: { ...settings, language: newLanguage }
                    });
                    await api.updateSettings({
                      ...settings,
                      language: newLanguage
                    });
                    console.log('✅ [Settings] Language saved to database successfully:', newLanguage);
                    
                    // Use setTimeout to ensure toast uses new language
                    setTimeout(() => {
                      toast({
                        title: t('success.saved'),
                        description: t('success.savedSuccessfully'),
                      });
                    }, 100);
                  } catch (error) {
                    console.error('❌ [Settings] Error saving language to database:', {
                      error,
                      attemptedLanguage: newLanguage,
                      previousLanguage
                    });
                    
                    // Revert language change if save fails
                    console.log('🔄 [Settings] Reverting language change due to save failure...');
                    await i18n.changeLanguage(previousLanguage);
                    localStorage.setItem('i18nextLng', previousLanguage);
                    setSettings({ ...settings, language: previousLanguage });
                    document.documentElement.dir = previousLanguage === 'ar' ? 'rtl' : 'ltr';
                    document.documentElement.lang = previousLanguage;
                    console.log('✅ [Settings] Language reverted to:', previousLanguage);
                    
                    setTimeout(() => {
                      toast({
                        title: t('errors.errorSaving'),
                        description: t('errors.couldNotSave'),
                        variant: 'destructive',
                      });
                    }, 100);
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="en">{t('settings.languageEnglish')}</option>
                <option value="ar">{t('settings.languageArabic')}</option>
                <option value="fr">{t('settings.languageFrench')}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Custom Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              {t('settings.customCategories')}
            </CardTitle>
            <CardDescription>
              {t('settings.customCategoriesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add/Edit Category Form */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex gap-2 flex-wrap">
                <Input
                  placeholder={t('settings.categoryName')}
                  value={editingCategory ? editingCategory.name : newCategory.name}
                    onChange={(e) => {
                      if (editingCategory) {
                        setEditingCategory({ ...editingCategory, name: e.target.value });
                      } else {
                        setNewCategory({ ...newCategory, name: e.target.value });
                      }
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && (editingCategory ? updateCategory(editingCategory) : addCategory())}
                    className="flex-1 min-w-[150px]"
                  />
                  <Select
                    value={editingCategory ? editingCategory.icon : newCategory.icon}
                    onValueChange={(value) => {
                      if (editingCategory) {
                        setEditingCategory({ ...editingCategory, icon: value });
                      } else {
                        setNewCategory({ ...newCategory, icon: value });
                      }
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue>
                        {(() => {
                          const Icon = getIconComponent(editingCategory ? editingCategory.icon : newCategory.icon);
                          return <Icon className="w-4 h-4" />;
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {AVAILABLE_ICONS.map((iconData) => {
                        const Icon = iconData.icon;
                        return (
                          <SelectItem key={iconData.name} value={iconData.name}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{iconData.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Select
                    value={editingCategory ? editingCategory.type || 'both' : newCategory.type}
                    onValueChange={(value: 'income' | 'expense' | 'both') => {
                      if (editingCategory) {
                        setEditingCategory({ ...editingCategory, type: value });
                      } else {
                        setNewCategory({ ...newCategory, type: value });
                      }
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">{t('settings.both')}</SelectItem>
                      <SelectItem value="income">{t('settings.income')}</SelectItem>
                      <SelectItem value="expense">{t('settings.expense')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingCategory ? (
                    <>
                      <Button onClick={() => updateCategory(editingCategory)} size="icon" variant="default">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => setEditingCategory(null)} size="icon" variant="outline">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button onClick={addCategory} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Categories List */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('settings.yourCategories')} ({settings.custom_categories.length})</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto">
                  {settings.custom_categories.map((category) => {
                    const Icon = getIconComponent(category.icon);
                    return (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative flex items-center gap-2 p-3 bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 transition-colors cursor-pointer"
                        onClick={() => setEditingCategory(category)}
                      >
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{category.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {category.type === 'income' ? t('settings.income') : 
                             category.type === 'expense' ? t('settings.expense') : 
                             t('settings.both')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCategory(category.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-opacity"
                        >
                          <X className="w-3 h-3 text-destructive" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
                {settings.custom_categories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t('settings.noCategoriesYet')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t('settings.accounts')}
            </CardTitle>
            <CardDescription>
              {t('settings.manageAccounts')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder={t('settings.accountCardName')}
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="flex-1"
                />
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as any })}
                  className="px-3 py-2 border rounded-lg bg-background"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <Button onClick={addAccount} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {settings.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {ACCOUNT_TYPES.find(t => t.value === account.type)?.label}
                      </p>
                    </div>
                    <Button
                      onClick={() => removeAccount(account.id)}
                      variant="ghost"
                      size="icon"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {settings.accounts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('settings.noAccountsAdded')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics Preferences
            </CardTitle>
            <CardDescription>
              Configure what analytics to display in your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Charts</Label>
                  <p className="text-sm text-muted-foreground">
                    Display income and expense charts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.analytics_preferences.showCharts ?? true}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      analytics_preferences: {
                        ...settings.analytics_preferences,
                        showCharts: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Trends</Label>
                  <p className="text-sm text-muted-foreground">
                    Display spending and income trends
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.analytics_preferences.showTrends ?? true}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      analytics_preferences: {
                        ...settings.analytics_preferences,
                        showTrends: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Projections</Label>
                  <p className="text-sm text-muted-foreground">
                    Display future financial projections
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.analytics_preferences.showProjections ?? true}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      analytics_preferences: {
                        ...settings.analytics_preferences,
                        showProjections: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;

